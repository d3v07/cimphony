from google.adk.agents import LlmAgent
from google.adk.tools import google_search

from backend.prompts.financial_prompt import FINANCIAL_ANALYST_PROMPT


def create_financial_agent() -> LlmAgent:
    return LlmAgent(
        name="FinancialAnalyst",
        model="gemini-2.0-flash",
        instruction=FINANCIAL_ANALYST_PROMPT,
        tools=[google_search],
        output_key="financial_data",
    )
