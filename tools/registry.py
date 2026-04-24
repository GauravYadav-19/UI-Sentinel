"""
Tool registry — maps ActionType to handler functions.

The dispatch table pattern replaces a chain of if/elif statements.
Adding a new tool is a 2-step process:
1. Create tools/new_tool.py with an execute function
2. Add one entry to TOOL_MAP
"""

from __future__ import annotations

import logging
from typing import Callable, Awaitable

from playwright.async_api import Page

from agent.state import ActionType, AgentDecision
from config.settings import settings
from tools.click import execute_click
from tools.hover import execute_hover
from tools.press_key import execute_press_key
from tools.scroll import execute_scroll_down, execute_scroll_up
from tools.type_text import execute_type

logger = logging.getLogger(__name__)

# Type alias for tool handler functions
ToolHandler = Callable[[Page, AgentDecision], Awaitable[None]]

TOOL_MAP: dict[ActionType, ToolHandler] = {
    ActionType.CLICK: execute_click,
    ActionType.TYPE: execute_type,
    ActionType.HOVER: execute_hover,
    ActionType.SCROLL_DOWN: execute_scroll_down,
    ActionType.SCROLL_UP: execute_scroll_up,
    ActionType.PRESS_KEY: execute_press_key,
}


async def execute_action(
    page: Page, decision: AgentDecision
) -> str | None:
    """Execute a tool based on the agent's decision.

    Returns:
        None on success, error string on failure.
    """
    handler = TOOL_MAP.get(decision.action)
    if handler is None:
        return f"No handler registered for action: {decision.action.value}"

    try:
        await handler(page, decision)
        # Let the page settle after the action
        await page.wait_for_timeout(settings.action_settle_ms)
        return None
    except Exception as e:
        logger.warning(
            "Tool '%s' failed on target %s: %s",
            decision.action.value,
            decision.target_id,
            e,
        )
        return str(e)
