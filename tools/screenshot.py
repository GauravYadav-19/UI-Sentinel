"""
Tool: Screenshot capture with interactive element annotation.

Reads mark_elements.js once at import time and caches it.
Uses asyncio.to_thread for the PIL Image.open call to avoid
blocking the event loop.
"""

from __future__ import annotations

import asyncio
import logging
import tempfile
from pathlib import Path

from PIL import Image
from playwright.async_api import Page

logger = logging.getLogger(__name__)

# Cache the JS injection script at module load time (read once, not per step)
_JS_PATH = Path(__file__).resolve().parent.parent / "mark_elements.js"
_MARK_ELEMENTS_JS: str | None = None


def _get_mark_js() -> str:
    """Lazily load and cache the element-marking JavaScript."""
    global _MARK_ELEMENTS_JS
    if _MARK_ELEMENTS_JS is None:
        _MARK_ELEMENTS_JS = _JS_PATH.read_text(encoding="utf-8")
    return _MARK_ELEMENTS_JS


async def capture_annotated_screenshot(
    page: Page, step: int
) -> Image.Image:
    """Inject element markers, take a screenshot, return a PIL Image.

    Screenshots are saved to a temp directory instead of the project root.
    The PIL Image.open is offloaded to a thread to avoid blocking the
    event loop.
    """
    # Inject bounding box overlays
    js = _get_mark_js()
    elements_marked = await page.evaluate(js)
    logger.debug("Marked %d interactive elements at step %d", elements_marked, step)

    # Save screenshot to temp dir (not project root)
    tmp_dir = Path(tempfile.gettempdir()) / "ui_sentinel_screenshots"
    tmp_dir.mkdir(exist_ok=True)
    screenshot_path = tmp_dir / f"step_{step}_state.png"

    await page.screenshot(path=str(screenshot_path))

    # Offload synchronous PIL operation to thread pool
    img = await asyncio.to_thread(Image.open, str(screenshot_path))
    return img
