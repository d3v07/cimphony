"""
Parsing utilities for agent synthesis output.

Extracts spoken_briefing (plain text) and deal_memo (structured JSON)
from the synthesis agent's raw text output.

The synthesis agent is prompted to output:
1. Plain text briefing (before the JSON block)
2. JSON block wrapped in ```json ... ```

This module is used by MAOrchestrator.analyze_company() to parse
the final synthesis output before writing to Firestore.
"""

import json
from typing import Any

# The 9 required keys for a valid deal memo, per the blueprint's synthesis prompt
REQUIRED_DEAL_MEMO_KEYS = [
    "verdict",
    "confidence",
    "one_liner",
    "red_flags",
    "follow_up_questions",
    "sources",
    "financials_summary",
    "competitive_summary",
    "risk_summary",
]

# Default values for each key type
_DEFAULTS = {
    "verdict": "WATCH",
    "confidence": "low",
    "one_liner": "",
    "red_flags": [],
    "follow_up_questions": [],
    "sources": [],
    "financials_summary": "",
    "competitive_summary": "",
    "risk_summary": "",
}


def parse_synthesis_output(raw_text: str) -> dict[str, Any]:
    """
    Parse the synthesis agent's raw output into spoken_briefing + deal_memo.

    The synthesis agent is prompted to output:
    1. Plain text briefing (before the JSON block)
    2. JSON block wrapped in ```json ... ```

    If no ```json block is found, attempts to parse the entire text as JSON.
    If parsing fails entirely, returns defaults with parse_error flag.

    Args:
        raw_text: Raw text output from the synthesis agent.

    Returns:
        dict with keys:
          - spoken_briefing (str): The plain text briefing portion
          - deal_memo (dict): Parsed JSON deal memo with all required keys
    """
    if not raw_text or not raw_text.strip():
        return {
            "spoken_briefing": "",
            "deal_memo": _build_default_memo(parse_error=True),
        }

    spoken_briefing = raw_text
    deal_memo = {}

    # Strategy 1: Look for ```json ... ``` fenced block
    if "```json" in raw_text:
        parts = raw_text.split("```json")
        spoken_briefing = parts[0].strip()
        json_part = parts[1].split("```")[0].strip()
        try:
            deal_memo = json.loads(json_part)
        except json.JSONDecodeError:
            deal_memo = {"raw": json_part, "parse_error": True}

    # Strategy 2: Try to parse the entire text as bare JSON
    elif _looks_like_json(raw_text):
        try:
            deal_memo = json.loads(raw_text.strip())
            spoken_briefing = raw_text.strip()
        except json.JSONDecodeError:
            deal_memo = {"parse_error": True}

    # Strategy 3: No JSON found at all — return defaults
    else:
        deal_memo = {"parse_error": True}

    # Ensure all required keys are present with defaults
    deal_memo = _ensure_required_keys(deal_memo)

    return {"spoken_briefing": spoken_briefing, "deal_memo": deal_memo}


def _looks_like_json(text: str) -> bool:
    """Check if text looks like it might be a JSON object."""
    stripped = text.strip()
    return stripped.startswith("{") and stripped.endswith("}")


def _build_default_memo(parse_error: bool = False) -> dict[str, Any]:
    """Build a deal memo with all default values."""
    memo = dict(_DEFAULTS)
    if parse_error:
        memo["parse_error"] = True
    return memo


def _ensure_required_keys(memo: dict) -> dict:
    """Ensure all 9 required keys exist in the deal memo, filling defaults."""
    for key in REQUIRED_DEAL_MEMO_KEYS:
        if key not in memo:
            memo[key] = _DEFAULTS[key]
    return memo
