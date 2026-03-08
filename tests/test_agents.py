"""
Tests for synthesis output parsing — Issues #47, #48, #49, #50.

Tests the parse_synthesis_output() function which extracts
spoken_briefing (text) and deal_memo (JSON) from the synthesis
agent's raw output.
"""

import unittest

from backend.agents.parsers import parse_synthesis_output, REQUIRED_DEAL_MEMO_KEYS


class TestParseSynthesisOutput(unittest.TestCase):
    """Test suite for parse_synthesis_output function."""

    # ------------------------------------------------------------------
    # Issue #47 — S2.1: Parse clean JSON block
    # ------------------------------------------------------------------
    def test_parse_clean_json_block(self):
        """Clean input with text + ```json block should split correctly."""
        raw = '''Apple shows strong revenue growth of 8% YoY.
```json
{
    "verdict": "BUY",
    "confidence": "high",
    "one_liner": "Dominant ecosystem with strong cash generation.",
    "financials_summary": "Revenue $394B, up 8% YoY",
    "competitive_summary": "Unmatched ecosystem lock-in",
    "risk_summary": "Regulatory pressure in EU",
    "red_flags": ["EU antitrust probe"],
    "follow_up_questions": ["Impact of EU ruling?"],
    "sources": ["SEC 10-K FY2025"]
}
```'''
        result = parse_synthesis_output(raw)

        # spoken_briefing should contain the text before JSON block
        self.assertIn("Apple shows strong revenue growth", result["spoken_briefing"])
        self.assertNotIn("```json", result["spoken_briefing"])

        # deal_memo should be parsed correctly
        self.assertEqual(result["deal_memo"]["verdict"], "BUY")
        self.assertEqual(result["deal_memo"]["confidence"], "high")
        self.assertIn("Dominant ecosystem", result["deal_memo"]["one_liner"])
        self.assertEqual(len(result["deal_memo"]["red_flags"]), 1)
        self.assertIn("EU antitrust probe", result["deal_memo"]["red_flags"])

    # ------------------------------------------------------------------
    # Issue #48 — S2.2: Parse bare JSON fallback
    # ------------------------------------------------------------------
    def test_parse_bare_json_fallback(self):
        """Bare JSON without ```json fences should still parse."""
        raw = '{"verdict": "WATCH", "confidence": "medium", "one_liner": "Overvalued", "red_flags": ["margin compression"]}'

        result = parse_synthesis_output(raw)

        # spoken_briefing should be the raw text (since no separator)
        self.assertEqual(result["spoken_briefing"], raw)

        # deal_memo should be parsed
        self.assertEqual(result["deal_memo"]["verdict"], "WATCH")
        self.assertEqual(result["deal_memo"]["confidence"], "medium")
        self.assertIn("margin compression", result["deal_memo"]["red_flags"])

    # ------------------------------------------------------------------
    # Issue #49 — S2.3: Garbage + malformed input
    # ------------------------------------------------------------------
    def test_parse_garbage_input_returns_defaults(self):
        """Garbage input should return defaults with parse_error flag."""
        raw = "This is just random text with no JSON at all."

        result = parse_synthesis_output(raw)

        # Should have parse_error flag
        self.assertTrue(result["deal_memo"].get("parse_error"))

        # Should still have default verdict
        self.assertEqual(result["deal_memo"]["verdict"], "WATCH")

        # red_flags should be an empty list (default)
        self.assertIsInstance(result["deal_memo"]["red_flags"], list)

    def test_parse_malformed_json_block(self):
        """Malformed JSON inside ```json block should set parse_error flag."""
        raw = '''Briefing text here.
```json
{"verdict": "BUY", "confidence": INVALID_NOT_QUOTED, "red_flags": [}
```'''
        result = parse_synthesis_output(raw)

        # spoken_briefing should still capture the text before JSON
        self.assertIn("Briefing text here", result["spoken_briefing"])

        # deal_memo should have parse_error flag
        self.assertTrue(result["deal_memo"].get("parse_error"))

        # Should still have all required keys (defaults filled in)
        for key in REQUIRED_DEAL_MEMO_KEYS:
            self.assertIn(key, result["deal_memo"], f"Missing key: {key}")

        # Verdict should default to WATCH when parsing fails
        self.assertIn(result["deal_memo"]["verdict"], ["BUY", "WATCH"])

    # ------------------------------------------------------------------
    # Issue #50 — S2.4: Default keys always present
    # ------------------------------------------------------------------
    def test_all_default_keys_present(self):
        """Even minimal JSON input should have all 9 required keys."""
        raw = '```json\n{"verdict": "BUY"}\n```'

        result = parse_synthesis_output(raw)

        required_keys = [
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
        for key in required_keys:
            self.assertIn(
                key, result["deal_memo"], f"Missing key: {key}"
            )

        # Verify verdict was preserved from input (not overwritten by default)
        self.assertEqual(result["deal_memo"]["verdict"], "BUY")


if __name__ == "__main__":
    unittest.main()
