"""
UI Sentinel — Slim FastAPI entrypoint.

This file is the HTTP boundary. It handles:
- Serving the dashboard HTML
- Accepting run/stop requests
- SSE streaming of agent step traces

All business logic lives in agent/ and tools/.
"""

from __future__ import annotations

import asyncio
import logging

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel
from playwright.async_api import async_playwright

from agent.loop import run_agent_loop
from config.settings import settings

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="UI Sentinel",
    description="Autonomous browser agent for UI testing",
    version="3.0.0",
)

# --- Request Schema ---

class TestRequest(BaseModel):
    """Validated input from the dashboard form."""
    url: str
    goal: str


# --- Session Management ---

_cancel_events: dict[str, asyncio.Event] = {}


# Root no longer serves HTML. UI is handled by Next.js in /frontend
@app.get("/")
async def root():
    return {"message": "UI Sentinel Backend Running. Frontend is at http://localhost:3000"}


@app.post("/api/stop-agent")
async def stop_agent() -> dict:
    """Set the cancel flag for all running sessions."""
    for event in _cancel_events.values():
        event.set()
    logger.info("Abort signal sent to %d session(s)", len(_cancel_events))
    return {"status": "stopped", "sessions_aborted": len(_cancel_events)}


@app.post("/api/run-agent")
async def run_agent(request: TestRequest) -> StreamingResponse:
    """Launch the agent and stream step traces via Server-Sent Events."""
    cancel_event = asyncio.Event()
    session_id = str(id(cancel_event))
    _cancel_events[session_id] = cancel_event

    logger.info(
        "Starting agent session %s | URL: %s | Goal: %s",
        session_id,
        request.url,
        request.goal,
    )

    async def event_stream():
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=settings.browser_headless,
                    slow_mo=settings.browser_slow_mo,
                )
                context = await browser.new_context(
                    viewport={
                        "width": settings.viewport_width,
                        "height": settings.viewport_height,
                    }
                )
                page = await context.new_page()
                await page.goto(request.url, wait_until="networkidle")

                async for trace in run_agent_loop(
                    page, request.goal, cancel_event
                ):
                    yield f"data: {trace.model_dump_json()}\n\n"

                await browser.close()
        except Exception as e:
            logger.exception("Agent session %s crashed: %s", session_id, e)
            yield f'data: {{"ai_error": "Session crashed: {e}", "step": 0}}\n\n'
        finally:
            _cancel_events.pop(session_id, None)
            logger.info("Session %s cleaned up", session_id)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Prevents nginx buffering
        },
    )