from string import Template

from google.adk.agents import LlmAgent

from backend.prompts.synthesis_prompt import SYNTHESIS_PROMPT

# Use safe_substitute so ADK session-state placeholders like
# {financial_data} survive untouched into the runtime instruction.
_TEMPLATE = Template(SYNTHESIS_PROMPT)


def create_synthesis_agent() -> LlmAgent:
    instruction = _TEMPLATE.safe_substitute()

    return LlmAgent(
        name="SynthesisAgent",
        model="gemini-2.0-flash",
        instruction=instruction,
        output_key="synthesis_output",
    )
