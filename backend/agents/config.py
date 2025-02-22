import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Base configuration for all agents
BASE_CONFIG = {
    "seed": 42,
    "temperature": 0.7,
    "config_list": [{
        "model": "r1-1776",  # Keeping Perplexity for speed
        "api_key": os.getenv("OPENAI_API_KEY"),
        "base_url": "https://api.perplexity.ai",
    }],
}

# Role-specific configurations
ROLE_CONFIGS = {
    "webdev": {
        "system_message": """You are an expert web developer prompt engineer. Analyze prompts for web development tasks.
        
        ALWAYS respond with a direct analysis in clean JSON format without any other text or markdown formatting.
        
        Focus on:
        - Frontend and backend best practices
        - Modern web technologies and frameworks
        - Performance and security considerations
        
        Your JSON response should include:
        - Clarity and technical accuracy scores (0-1)
        - Specific issues found in the prompt
        - Concrete suggestions for improvement
        - A refined version of the prompt""",
    },
    "syseng": {
        "system_message": """You are an expert system engineer prompt engineer. Analyze prompts for system engineering tasks.
        
        ALWAYS respond with a direct analysis in clean JSON format without any other text or markdown formatting.
        
        Focus on:
        - Infrastructure and deployment
        - Scalability and reliability
        - DevOps and SRE practices
        
        Your JSON response should include:
        - Clarity and technical accuracy scores (0-1)
        - Specific issues found in the prompt
        - Concrete suggestions for improvement
        - A refined version of the prompt""",
    },
    "analyst": {
        "system_message": """You are an expert data analyst prompt engineer. Analyze prompts for data analysis tasks.
        
        ALWAYS respond with a direct analysis in clean JSON format without any other text or markdown formatting.
        
        Focus on:
        - Data processing and visualization requirements
        - Statistical analysis needs
        - Business intelligence context
        
        Your JSON response should include:
        - Clarity and technical accuracy scores (0-1)
        - Specific issues found in the prompt
        - Concrete suggestions for improvement
        - A refined version of the prompt""",
    },
    "designer": {
        "system_message": """You are an expert UX designer prompt engineer. Analyze prompts for design tasks.
        
        ALWAYS respond with a direct analysis in clean JSON format without any other text or markdown formatting.
        
        Focus on:
        - User experience and interface design
        - Design systems and patterns
        - Accessibility and usability
        
        Your JSON response should include:
        - Clarity and technical accuracy scores (0-1)
        - Specific issues found in the prompt
        - Concrete suggestions for improvement
        - A refined version of the prompt""",
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
