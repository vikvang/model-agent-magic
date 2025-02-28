import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Gregify API"
    PROJECT_VERSION: str = "1.0.0"
    PROJECT_DESCRIPTION: str = "API for processing prompts through a multi-agent system"
    
    # API keys
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    PERPLEXITY_BASE_URL: str = "https://api.perplexity.ai"
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS settings
    CORS_ORIGINS: list = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = False
    CORS_ALLOW_METHODS: list = ["*"]
    CORS_ALLOW_HEADERS: list = ["*"]
    
    # Model settings
    DEFAULT_MODEL: str = "sonar"
    DEFAULT_TEMPERATURE: float = 0.7
    DEFAULT_MAX_TOKENS: int = 1500
    SEED: int = 42
    
    def validate(self) -> None:
        """Validate the required environment variables."""
        if not self.OPENAI_API_KEY:
            print("WARNING: No OPENAI_API_KEY found in environment variables")
            print("Please ensure you have a .env file with OPENAI_API_KEY set")

# Create a global settings instance
settings = Settings() 