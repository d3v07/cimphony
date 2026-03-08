from google.adk.agents import LlmAgent
from google.adk.tools import google_search

from backend.prompts.sentiment_prompt import SENTIMENT_ANALYST_PROMPT


def create_sentiment_agent() -> LlmAgent:
    return LlmAgent(
        name="SentimentAnalyst",
        model="gemini-2.0-flash",
        instruction=SENTIMENT_ANALYST_PROMPT,
        tools=[google_search],
        output_key="sentiment_data",
    )
