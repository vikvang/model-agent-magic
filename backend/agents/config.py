import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Base configuration for all agents
BASE_CONFIG = {
    "seed": 42,
    "temperature": 0.7,
    "config_list": [{
        "model": "sonar",  # change model here
        "api_key": os.getenv("OPENAI_API_KEY"),
        "base_url": "https://api.perplexity.ai",
        # modify this to use gpt-4 for the agents later
    }],
}

# Role-specific configurations
ROLE_CONFIGS = {
    "webdev": {
        "system_message": """You are an expert web developer prompt engineer. 
        Analyze and improve prompts related to web development, focusing on:
        - Frontend and backend best practices
        - Modern web technologies and frameworks
        - Performance and security considerations""",
    },
    "syseng": {
        "system_message": """You are an expert system engineer prompt engineer.
        Analyze and improve prompts related to system engineering, focusing on:
        - Infrastructure and deployment
        - Scalability and reliability
        - DevOps and SRE practices""",
    },
    "analyst": {
        "system_message": """You are an expert data analyst prompt engineer.
        Analyze and improve prompts related to data analysis, focusing on:
        - Data processing and visualization
        - Statistical analysis
        - Business intelligence""",
    },
    "designer": {
        "system_message": """You are an expert UX designer prompt engineer.
        Analyze and improve prompts related to design, focusing on:
        - User experience and interface design
        - Design systems and patterns
        - Accessibility and usability""",
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
