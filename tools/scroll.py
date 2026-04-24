"""Tool: Scroll the page up or down by one viewport height."""

from playwright.async_api import Page

from agent.state import AgentDecision


async def execute_scroll_down(page: Page, decision: AgentDecision) -> None:
    """Scroll down by one viewport height."""
    await page.evaluate("window.scrollBy(0, window.innerHeight)")


async def execute_scroll_up(page: Page, decision: AgentDecision) -> None:
    """Scroll up by one viewport height."""
    await page.evaluate("window.scrollBy(0, -window.innerHeight)")
