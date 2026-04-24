"""
Brain — the LLM reasoning engine with structured retry logic.

Architecture:
1. Model fallback chain: tries each model in config.model_chain
2. Per-model retry (default 3x): catches JSON parse errors and
   Pydantic validation errors, then retries — the LLM often self-corrects
3. asyncio.to_thread: moves the synchronous Gemini SDK call off the
   event loop so it doesn't block other async tasks
4. AgentDecision validation: hallucinated tools are caught immediately
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import TYPE_CHECKING

from google import genai
from pydantic import ValidationError

from agent.state import AgentDecision
from config.settings import settings

if TYPE_CHECKING:
    from PIL.Image import Image

logger = logging.getLogger(__name__)


class Brain:
    """Wraps the Gemini client with retry, validation, and model fallback."""

    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._models = settings.model_chain
        self._max_retries = settings.max_retries_per_model

    async def reason(
        self, image: Image, prompt: str
    ) -> tuple[AgentDecision, str]:
        """Ask the LLM for the next action.

        Returns:
            (validated_decision, model_name)

        Raises:
            RuntimeError: if all models and retries are exhausted.
        """
        last_error: Exception | None = None

        for model_name in self._models:
            for attempt in range(1, self._max_retries + 1):
                try:
                    # Move synchronous SDK call off the event loop
                    response = await asyncio.to_thread(
                        self._client.models.generate_content,
                        model=model_name,
                        contents=[image, prompt],
                    )

                    raw = response.text or ""
                    logger.debug(
                        "Model %s attempt %d raw output: %s",
                        model_name,
                        attempt,
                        raw[:300],
                    )

                    # Extract JSON from potentially markdown-wrapped output
                    match = re.search(r"\{.*\}", raw, re.DOTALL)
                    if not match:
                        raise ValueError(
                            f"No JSON object found in LLM response: "
                            f"{raw[:200]}"
                        )

                    # Validate against Pydantic model — catches hallucinated actions
                    decision = AgentDecision.model_validate_json(
                        match.group(0)
                    )
                    return decision, model_name

                except (json.JSONDecodeError, ValidationError, ValueError) as e:
                    # Retriable: the LLM returned malformed or invalid output
                    last_error = e
                    logger.warning(
                        "Model %s attempt %d parse/validation error: %s",
                        model_name,
                        attempt,
                        e,
                    )
                    continue

                except Exception as api_err:
                    # Non-retriable at this model level (quota, network, etc.)
                    last_error = api_err
                    logger.error(
                        "Model %s API error: %s", model_name, api_err
                    )
                    break  # Move to next model in the chain

        raise RuntimeError(
            f"All models exhausted after retries. Last error: {last_error}"
        )
