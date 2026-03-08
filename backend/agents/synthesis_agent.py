from google.adk.agents import LlmAgent

from backend.prompts.synthesis_prompt import SYNTHESIS_PROMPT


def create_synthesis_agent() -> LlmAgent:
    instruction = SYNTHESIS_PROMPT.format(
        financial_data="{financial_data}",
        competitive_data="{competitive_data}",
        sentiment_data="{sentiment_data}",
    )

    return LlmAgent(
        name="SynthesisAgent",
        model="gemini-2.0-flash",
        instruction=instruction,
        output_key="synthesis_output",
    )
