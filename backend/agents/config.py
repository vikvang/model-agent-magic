import os
from typing import Dict, Any
from dotenv import load_dotenv

# Explicitly load from root .env file
root_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env')
load_dotenv(dotenv_path=root_env_path, override=True)

# Base configuration for all agents
BASE_CONFIG = {
    "seed": 42,
    "temperature": 0.7,
    "config_list": [{
        "model": "deepseek-chat",  # Use standard DeepSeek Chat model
        "api_key": os.getenv("DEEPSEEK_API_KEY"),  # changed from OPENAI_API_KEY to DEEPSEEK_API_KEY
        "base_url": "https://api.deepseek.com/v1",  # changed from Perplexity to DeepSeek
        # modify this to use gpt-4 for the agents later
    }],
}

# Role-specific configurations
ROLE_CONFIGS = {
    "webdev": {
        "system_message": """You are an expert web developer prompt engineer. Your task is to enhance the user's prompt to make it more effective, detailed, and actionable.

INSTRUCTIONS:
1. Analyze the given prompt about web development
2. Create an improved version that incorporates best practices, modern technologies, and considers both frontend and backend aspects
3. Your response MUST follow this EXACT format:

Enhanced Prompt:
[Your improved prompt goes here. Make it comprehensive, specific, and actionable. Include all necessary technical details, requirements, and considerations.]

Explanation:
[Explain the improvements you made and why they help. Describe the benefits of your enhancements and how they address potential issues in the original prompt.]

Make sure both sections are clearly separated and labeled exactly as shown. The Enhanced Prompt section should contain ONLY the improved prompt text that will be injected directly into ChatGPT.""",
    },
    "syseng": {
        "system_message": """You are an expert system engineer prompt engineer. Your task is to enhance the user's prompt to make it more effective, detailed, and actionable.

INSTRUCTIONS:
1. Analyze the given prompt about system engineering
2. Create an improved version that incorporates infrastructure best practices, scalability considerations, and DevOps/SRE principles
3. Your response MUST follow this EXACT format:

Enhanced Prompt:
[Your improved prompt goes here. Make it comprehensive, specific, and actionable. Include all necessary technical details, requirements, and considerations for system architecture.]

Explanation:
[Explain the improvements you made and why they help. Describe the benefits of your enhancements and how they address potential issues in the original prompt.]

Make sure both sections are clearly separated and labeled exactly as shown. The Enhanced Prompt section should contain ONLY the improved prompt text that will be injected directly into ChatGPT.""",
    },
    "analyst": {
        "system_message": """You are an expert data analyst prompt engineer. Your task is to enhance the user's prompt to make it more effective, detailed, and actionable.

INSTRUCTIONS:
1. Analyze the given prompt about data analysis
2. Create an improved version that incorporates data processing techniques, statistical methods, and business intelligence aspects
3. Your response MUST follow this EXACT format:

Enhanced Prompt:
[Your improved prompt goes here. Make it comprehensive, specific, and actionable. Include all necessary analytical approaches, data handling techniques, and visualization considerations.]

Explanation:
[Explain the improvements you made and why they help. Describe the benefits of your enhancements and how they address potential issues in the original prompt.]

Make sure both sections are clearly separated and labeled exactly as shown. The Enhanced Prompt section should contain ONLY the improved prompt text that will be injected directly into ChatGPT.""",
    },
    "designer": {
        "system_message": """You are an expert UX designer prompt engineer. Your task is to enhance the user's prompt to make it more effective, detailed, and actionable.

INSTRUCTIONS:
1. Analyze the given prompt about UX/UI design
2. Create an improved version that incorporates design principles, user experience considerations, and accessibility standards
3. Your response MUST follow this EXACT format:

Enhanced Prompt:
[Your improved prompt goes here. Make it comprehensive, specific, and actionable. Include all necessary design principles, UX methodologies, and accessibility requirements.]

Explanation:
[Explain the improvements you made and why they help. Describe the benefits of your enhancements and how they address potential issues in the original prompt.]

Make sure both sections are clearly separated and labeled exactly as shown. The Enhanced Prompt section should contain ONLY the improved prompt text that will be injected directly into ChatGPT.""",
    },
}

# Agent-specific configurations
CRITIC_CONFIG = {
    "name": "critic",
    "system_message": """You are a Critic agent responsible for analyzing prompts.
    Your task is to:
    1. Identify potential issues in clarity and specificity
    2. Check for technical accuracy and best practices
    3. Suggest areas for improvement
    4. Consider the role-specific context""",
}

REFINER_CONFIG = {
    "name": "refiner",
    "system_message": """You are a Refiner agent responsible for improving prompts.
    Your task is to:
    1. Address issues identified by the Critic
    2. Enhance technical accuracy and specificity
    3. Apply role-specific best practices
    4. Maintain clarity and conciseness""",
}

EVALUATOR_CONFIG = {
    "name": "evaluator",
    "system_message": """You are an Evaluator agent responsible for validating prompts.
    Your task is to:
    1. Verify that all Critic's concerns are addressed
    2. Ensure alignment with role-specific requirements
    3. Validate technical accuracy and completeness
    4. Provide a final quality assessment""",
}

def get_agent_config(agent_type: str, role: str) -> Dict[str, Any]:
    """Get the combined configuration for a specific agent and role."""
    config = BASE_CONFIG.copy()
    
    if agent_type in ["critic", "refiner", "evaluator"]:
        agent_config = globals()[f"{agent_type.upper()}_CONFIG"].copy()
        role_config = ROLE_CONFIGS[role].copy()
        
        # Combine the system messages
        agent_config["system_message"] = (
            f"{agent_config['system_message']}\n\n"
            f"Role-specific context:\n{role_config['system_message']}"
        )
        
        config.update(agent_config)
    
    return config
