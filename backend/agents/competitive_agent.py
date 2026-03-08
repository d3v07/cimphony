from google.adk.agents import LlmAgent
from google.adk.tools import google_search

from backend.prompts.competitive_prompt import COMPETITIVE_ANALYST_PROMPT


def create_competitive_agent() -> LlmAgent:
    return LlmAgent(
        name="CompetitiveAnalyst",
        model="gemini-2.0-flash",
        instruction=COMPETITIVE_ANALYST_PROMPT,
        tools=[google_search],
        output_key="competitive_data",
    )
