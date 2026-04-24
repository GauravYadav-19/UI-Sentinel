"""
Centralized configuration via Pydantic Settings.
All secrets and tunables are loaded from environment variables / .env file.
No hardcoded values in execution logic.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- Secrets ---
    gemini_api_key: str

    # --- LLM Configuration ---
    model_chain: list[str] = ["gemini-2.5-flash"]
    max_retries_per_model: int = 3

    # --- Agent Behavior ---
    max_steps: int = 15
    action_settle_ms: int = 2000  # Wait after each action for page to settle
    action_timeout_ms: int = 5000  # Playwright locator timeout

    # --- Browser ---
    browser_headless: bool = False
    browser_slow_mo: int = 1500
    viewport_width: int = 1280
    viewport_height: int = 800

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


# Singleton — imported as `from config.settings import settings`
settings = Settings()
