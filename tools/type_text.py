"""Tool: Type text into an input field and press Enter."""

from playwright.async_api import Page

from agent.state import AgentDecision
from config.settings import settings


async def execute_type(page: Page, decision: AgentDecision) -> None:
    """Fill the input at [data-agent-id='<target_id>'] then press Enter."""
    if decision.target_id is None:
        raise ValueError("Type action requires a target_id.")
    if not decision.input_text:
        raise ValueError("Type action requires non-empty input_text.")

    locator = page.locator(
        f"[data-agent-id='{decision.target_id}']"
    )
    await locator.fill(decision.input_text, timeout=settings.action_timeout_ms)
    await page.wait_for_timeout(500)
    await page.keyboard.press("Enter")
