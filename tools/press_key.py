"""Tool: Press a keyboard key (Escape, Enter, Tab, etc.)."""

from playwright.async_api import Page

from agent.state import AgentDecision


async def execute_press_key(page: Page, decision: AgentDecision) -> None:
    """Press the key named in decision.input_text."""
    if not decision.input_text:
        raise ValueError("press_key action requires input_text (the key name).")
    await page.keyboard.press(decision.input_text)
