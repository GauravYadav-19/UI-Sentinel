"""
Pydantic models for strict type safety across the agent pipeline.

If the LLM hallucinates a tool like "right_click", the ActionType enum
rejects it at the Pydantic boundary with a ValidationError — which our
retry logic catches and feeds back to the LLM.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ActionType(str, Enum):
    """Exhaustive set of actions the agent can take. Any value outside
    this enum triggers a Pydantic ValidationError."""

    CLICK = "click"
    TYPE = "type"
    HOVER = "hover"
    PRESS_KEY = "press_key"
    SCROLL_DOWN = "scroll_down"
    SCROLL_UP = "scroll_up"
    DONE = "done"


class AgentDecision(BaseModel):
    """Validated LLM output. The model MUST return all fields in the
    correct shape or Pydantic will reject the response."""

    thought_process: str = Field(
        ..., description="The agent's step-by-step reasoning"
    )
    action: ActionType = Field(
        ..., description="One of the valid ActionType values"
    )
    target_id: Optional[int] = Field(
        default=None, description="The data-agent-id of the target element"
    )
    input_text: str = Field(
        default="", description="Text to type or key name to press"
    )


class StepTrace(BaseModel):
    """One step of the agent's execution trace. Streamed to the frontend
    via SSE."""

    step: int
    model_used: Optional[str] = None
    decision: Optional[AgentDecision] = None
    execution_error: Optional[str] = None
    ai_error: Optional[str] = None
