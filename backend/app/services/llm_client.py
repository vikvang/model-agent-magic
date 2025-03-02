from typing import Dict, List, Any, Optional
from openai import OpenAI
from ..core.config import settings

class LLMClient:
    """Service for interacting with large language models."""
    
    def __init__(self):
        """Initialize the LLM client with API key and base URL."""
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.PERPLEXITY_BASE_URL
        )
    
    def generate_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Generate a chat completion from the model.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            model: The model to use for completion
            temperature: The temperature for sampling
            max_tokens: The maximum number of tokens to generate
            
        Returns:
            The model response
        """
        try:
            response = self.client.chat.completions.create(
                model=model or settings.DEFAULT_MODEL,
                messages=messages,
                temperature=temperature or settings.DEFAULT_TEMPERATURE,
                max_tokens=max_tokens or settings.DEFAULT_MAX_TOKENS,
            )
            
            return {
                "success": True,
                "content": response.choices[0].message.content,
                "model": response.model,
                "metadata": {
                    "finish_reason": response.choices[0].finish_reason,
                    "model": response.model,
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": str(type(e).__name__),
            }

# Create a global client instance
llm_client = LLMClient() 