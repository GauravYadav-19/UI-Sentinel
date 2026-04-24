"""Tool: Hover over an element to reveal dropdowns or tooltips."""

from playwright.async_api import Page

from agent.state import AgentDecision
from config.settings import settings


async def execute_hover(page: Page, decision: AgentDecision) -> None:
    """Hover over the element at [data-agent-id='<target_id>']."""
    if decision.target_id is None:
        raise ValueError("Hover action requires a target_id.")
    await page.locator(
        f"[data-agent-id='{decision.target_id}']"
    ).hover(timeout=settings.action_timeout_ms)
