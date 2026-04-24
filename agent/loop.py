"""
The core Plan-Act-Observe loop, fully decoupled from FastAPI.

This is an AsyncGenerator — it yields one StepTrace per iteration,
which the FastAPI layer can stream as SSE events. The loop itself
knows nothing about HTTP, HTML, or the frontend.

Cancellation is handled via asyncio.Event (thread-safe) instead of
shared mutable class variables.
"""

from __future__ import annotations

import asyncio
import logging
from typing import AsyncGenerator

from playwright.async_api import Page

from agent.brain import Brain
from agent.prompts import build_step_prompt
from agent.state import ActionType, StepTrace
from config.settings import settings
from tools.registry import execute_action
from tools.screenshot import capture_annotated_screenshot

logger = logging.getLogger(__name__)


async def run_agent_loop(
    page: Page,
    goal: str,
    cancel_event: asyncio.Event,
) -> AsyncGenerator[StepTrace, None]:
    """Execute the autonomous agent loop.

    Yields one StepTrace per step, enabling real-time SSE streaming.
    Stops when the LLM reports 'done', max steps are reached, or
    the cancel_event is set.
    """
    brain = Brain()
    history: list[StepTrace] = []

    for step in range(1, settings.max_steps + 1):
        # --- CHECK CANCELLATION ---
        if cancel_event.is_set():
            logger.info("Agent aborted by user at step %d", step)
            yield StepTrace(step=step, ai_error="Aborted by user.")
            return

        logger.info("--- Step %d ---", step)

        # --- 1. OBSERVE: Capture annotated screenshot ---
        try:
            screenshot_img = await capture_annotated_screenshot(page, step)
        except Exception as e:
            logger.error("Screenshot capture failed at step %d: %s", step, e)
            yield StepTrace(step=step, ai_error=f"Screenshot failed: {e}")
            return

        # --- 2. PLAN: Ask the LLM for the next action ---
        prompt = build_step_prompt(goal, history)
        try:
            decision, model_name = await brain.reason(screenshot_img, prompt)
        except RuntimeError as e:
            logger.error("Brain exhausted at step %d: %s", step, e)
            yield StepTrace(step=step, ai_error=str(e))
            return

        logger.info(
            "[%s] Thought: %s", model_name, decision.thought_process
        )

        trace = StepTrace(
            step=step, model_used=model_name, decision=decision
        )

        # --- 3. ACT: Execute the decided tool ---
        if decision.action == ActionType.DONE:
            logger.info("Agent reports goal achieved at step %d", step)
            yield trace
            return

        error = await execute_action(page, decision)
        if error:
            trace.execution_error = error
            logger.warning("Action failed at step %d: %s", step, error)

        history.append(trace)
        yield trace

    # Max steps exhausted
    logger.warning("Max steps (%d) reached without completion", settings.max_steps)
    yield StepTrace(
        step=settings.max_steps,
        ai_error=f"Max steps ({settings.max_steps}) reached without achieving goal.",
    )
