from typing import Dict, Any, List
from .config import settings

# Base configuration for all agents
BASE_CONFIG = {
    "seed": settings.SEED,
    "temperature": settings.DEFAULT_TEMPERATURE,
    "config_list": [{
        "model": settings.DEFAULT_MODEL,
        "api_key": settings.OPENAI_API_KEY,
        "base_url": settings.PERPLEXITY_BASE_URL,
    }],
}

# Role-specific configurations
ROLE_CONFIGS: Dict[str, Dict[str, Any]] = {
    "webdev": {
        "name": "Web Developer",
        "system_message": """You are an expert web developer prompt engineer. 
        Analyze and improve prompts related to web development, focusing on:
        - Frontend and backend best practices
        - Modern web technologies and frameworks
        - Performance and security considerations""",
    },
    "syseng": {
        "name": "System Engineer",
        "system_message": """You are an expert system engineer prompt engineer.
        Analyze and improve prompts related to system engineering, focusing on:
        - Scalability and reliability""",
    },
    "analyst": {
        "name": "Data Analyst",
        "system_message": """You are an expert data analyst prompt engineer.
        Analyze and improve prompts related to data analysis, focusing on:
        - Data processing and visualization
        - Statistical analysis
        - Business intelligence""",
    },
    "designer": {
        "name": "UX Designer",
        "system_message": """You are an expert UX designer prompt engineer.
        Analyze and improve prompts related to design, focusing on:
        - User experience and interface design
        - Design systems and patterns
        - Accessibility and usability""",
    },
}

# Agent-specific configurations
AGENT_CONFIGS: Dict[str, Dict[str, Any]] = {
    "critic": {
        "name": "critic",
        "system_message": """You are a Critic agent responsible for analyzing prompts.
        Your task is to:
        1. Identify potential issues in clarity and specificity
        2. Check for technical accuracy and best practices
        3. Suggest areas for improvement
        4. Consider the role-specific context""",
        "temperature": 0.7,
    },
    "refiner": {
        "name": "refiner",
        "system_message": """You are a Refiner agent responsible for improving prompts.
        Your task is to:
        1. Address issues identified by the Critic
        2. Enhance technical accuracy and specificity
        3. Apply role-specific best practices
        4. Maintain clarity and conciseness""",
        "temperature": 0.5,
    },
    "evaluator": {
        "name": "evaluator",
        "system_message": """You are an Evaluator agent responsible for validating prompts.
        Your task is to:
        1. Verify that all Critic's concerns are addressed
        2. Ensure alignment with role-specific requirements
        3. Validate technical accuracy and completeness
        4. Provide a final quality assessment""",
        "temperature": 0.3,
    },
}

def get_available_roles() -> List[str]:
    """Get a list of all available roles."""
    return list(ROLE_CONFIGS.keys())

def get_agent_config(agent_type: str, role: str) -> Dict[str, Any]:
    """Get the combined configuration for a specific agent and role."""
    if agent_type not in AGENT_CONFIGS:
        raise ValueError(f"Unknown agent type: {agent_type}")
    
    if role not in ROLE_CONFIGS:
        raise ValueError(f"Unknown role: {role}")
    
    # Start with the base config
    config = BASE_CONFIG.copy()
    
    # Add agent-specific config
    agent_config = AGENT_CONFIGS[agent_type].copy()
    
    # Add role-specific context to the system message
    role_config = ROLE_CONFIGS[role].copy()
    
    # Combine the system messages
    agent_config["system_message"] = (
        f"{agent_config['system_message']}\n\n"
        f"Role-specific context:\n{role_config['system_message']}"
    )
    
    # Update the config with agent-specific settings
    config.update(agent_config)
    
    return config 