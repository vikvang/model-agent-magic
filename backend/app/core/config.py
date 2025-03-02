import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from root .env file explicitly
root_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), '.env')
load_dotenv(dotenv_path=root_env_path, override=True)

class Settings:
    PROJECT_NAME: str = "Gregify API"
    PROJECT_VERSION: str = "1.0.0"
    PROJECT_DESCRIPTION: str = "API for processing prompts through a multi-agent system"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    IS_PRODUCTION: bool = ENVIRONMENT == "production"
    
    # API keys
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    PERPLEXITY_BASE_URL: str = os.getenv(
        "PERPLEXITY_BASE_URL",
        "https://api.perplexity.ai"
    )
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS settings
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "chrome-extension://*/")
    CORS_ORIGINS: list = [
        FRONTEND_URL,
        "chrome-extension://bpoeahfpbjimmjjgjiojokbljpgpjjee",  # Your specific extension ID
        "chrome-extension://*",
        "http://localhost:3000",
        "http://localhost:5173",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list = ["*"]
    CORS_ALLOW_HEADERS: list = ["*"]
    
    # Model settings
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "sonar")
    DEFAULT_TEMPERATURE: float = float(os.getenv("DEFAULT_TEMPERATURE", "0.7"))
    DEFAULT_MAX_TOKENS: int = int(os.getenv("DEFAULT_MAX_TOKENS", "1500"))
    SEED: int = int(os.getenv("SEED", "42"))
    
    # Supabase settings
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY")
    
    # JWT settings for authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key-for-development-only")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "60"))
    
    def validate(self) -> None:
        """Validate the required environment variables."""
        missing_vars = []
        
        if not self.OPENAI_API_KEY:
            missing_vars.append("OPENAI_API_KEY")
            
        if self.IS_PRODUCTION:
            # Additional checks for production
            if not self.SUPABASE_URL:
                missing_vars.append("SUPABASE_URL")
                
            if not self.SUPABASE_KEY:
                missing_vars.append("SUPABASE_KEY")
                
            if self.JWT_SECRET == "your-secret-key-for-development-only":
                missing_vars.append("JWT_SECRET")
        
        if missing_vars:
            print(f"WARNING: Missing required environment variables: {', '.join(missing_vars)}")
            print("Please ensure you have a .env file with the required variables set")
            
        if not self.IS_PRODUCTION and self.JWT_SECRET == "your-secret-key-for-development-only":
            print("WARNING: Using default JWT secret in development mode. DO NOT use this in production!")

# Create a global settings instance
settings = Settings() 