"""
Prompt templates — separated from execution logic so they can be
iterated on independently. Changes to prompts don't require touching
the agent loop or brain.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agent.state import StepTrace


def _format_history(history: list[StepTrace]) -> str:
    """Format past steps into a concise text block for the LLM context."""
    if not history:
        return "None"

    lines: list[str] = []
    for t in history:
        if t.ai_error:
            lines.append(f"Step {t.step}: AI Error - {t.ai_error}")
        elif t.decision:
            status = t.execution_error or "Success"
            lines.append(
                f"Step {t.step}: Action '{t.decision.action.value}' "
                f"on target {t.decision.target_id or 'none'} - "
                f"Status: {status}"
            )
    return "\n".join(lines)


def build_step_prompt(goal: str, history: list[StepTrace]) -> str:
    """Build the user prompt for a single Plan-Act-Observe step."""
    history_text = _format_history(history)

    return f"""User Goal: {goal}.

Past Actions Taken So Far:
{history_text}

Look at the screenshot and your Past Actions. Determine the logical NEXT action to progress toward the goal.
If a past action failed, try a different approach or a different target_id.

Available Actions:
1. "click": Click on a specific element. Requires 'target_id'.
2. "type": Type text into an input field and hit Enter. Requires 'target_id' and 'input_text'.
3. "hover": Hover the mouse over an element to reveal dropdowns or menus. Requires 'target_id'.
4. "press_key": Press a specific keyboard key (e.g., "Escape", "Enter", "Tab"). Requires 'input_text' to be the key name.
5. "scroll_down": Scroll the page down by one viewport.
6. "scroll_up": Scroll the page up by one viewport.
7. "done": The user's goal has been fully achieved.

IMPORTANT: If the user's final goal has ALREADY been achieved, your action MUST be "done". Do not repeat past actions.

You must respond ONLY with a raw JSON object. Do not use markdown code blocks.
Format:
{{
    "thought_process": "Explain your logic...",
    "action": "click" | "type" | "hover" | "press_key" | "scroll_down" | "scroll_up" | "done",
    "target_id": 13,
    "input_text": "Text to type or key to press, otherwise empty string"
}}"""
