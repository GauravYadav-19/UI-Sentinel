"""Tool: Click on an element identified by data-agent-id."""

from playwright.async_api import Page

from agent.state import AgentDecision
from config.settings import settings


async def execute_click(page: Page, decision: AgentDecision) -> None:
    """Click the element matching [data-agent-id='<target_id>']."""
    if decision.target_id is None:
        raise ValueError("Click action requires a target_id.")
    await page.locator(
        f"[data-agent-id='{decision.target_id}']"
    ).click(timeout=settings.action_timeout_ms)
