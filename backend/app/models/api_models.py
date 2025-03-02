from typing import Dict, List, Optional, Union, Any
from pydantic import BaseModel, Field

class PromptRequest(BaseModel):
    """
    Request model for processing a prompt.
    """
    prompt: str = Field(..., description="The prompt text to enhance")
    role: str = Field(..., description="The role context for the prompt")
    model: str = Field("sonar", description="The model to use for processing")
    sessionId: str = Field(..., description="Unique session identifier")

class AgentMessage(BaseModel):
    """
    Model for messages from agents.
    """
    type: str = Field(..., description="Type of message")
    content: str = Field(..., description="Message content")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class PromptResponse(BaseModel):
    """
    Response model for the multi-agent prompt processing.
    """
    success: bool = Field(..., description="Whether the operation was successful")
    messages: List[AgentMessage] = Field(default_factory=list, description="Messages from the agents")
    final_prompt: str = Field(..., description="The final enhanced prompt")
    error: Optional[str] = Field(None, description="Error message if any")

class NormalPromptResponse(BaseModel):
    """
    Response model for the single-agent prompt processing.
    """
    success: bool = Field(..., description="Whether the operation was successful")
    response: str = Field(..., description="The enhanced prompt")
    error: Optional[str] = Field(None, description="Error message if any")

class HealthResponse(BaseModel):
    """
    Response model for the health check endpoint.
    """
    status: str = Field(..., description="Health status")
    api_configured: bool = Field(..., description="Whether the API key is configured")
    api_key_length: int = Field(..., description="Length of the API key")
    roles_available: List[str] = Field(..., description="Available roles")

class APITestResponse(BaseModel):
    """
    Response model for the API test endpoint.
    """
    success: bool = Field(..., description="Whether the test was successful")
    message: str = Field(..., description="Status message")
    response: Optional[str] = Field(None, description="Response from the LLM API")
    model: Optional[str] = Field(None, description="Model used")
    api_key_configured: bool = Field(..., description="Whether the API key is configured")
    error: Optional[str] = Field(None, description="Error message if any")
    error_type: Optional[str] = Field(None, description="Type of error if any")
    traceback: Optional[str] = Field(None, description="Error traceback if any") 