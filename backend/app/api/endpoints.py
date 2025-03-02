from fastapi import APIRouter, HTTPException, status
from ..models.api_models import (
    PromptRequest,
    PromptResponse,
    NormalPromptResponse,
    HealthResponse,
    APITestResponse,
)
from ..services import prompt_processor, llm_client
from ..core.config import settings
from ..core.agent_config import get_available_roles

router = APIRouter()

@router.get("/", tags=["general"])
async def root():
    """Root endpoint with API information."""
    return {
        "status": "online",
        "endpoints": {
            "process-prompt": "/process-prompt (POST)",
            "normal-prompt": "/normal-prompt (POST)"
        },
        "available_roles": get_available_roles()
    }

@router.get("/health", response_model=HealthResponse, tags=["general"])
async def health_check():
    """Health check endpoint to verify API connectivity."""
    # Check if the API key is configured
    if not settings.OPENAI_API_KEY:
        return HealthResponse(
            status="warning", 
            api_configured=False,
            api_key_length=0,
            roles_available=get_available_roles()
        )
    
    return HealthResponse(
        status="healthy",
        api_configured=bool(settings.OPENAI_API_KEY),
        api_key_length=len(settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else 0,
        roles_available=get_available_roles()
    )

@router.get("/test-api", response_model=APITestResponse, tags=["testing"])
async def test_api():
    """Test endpoint to verify LLM API is working."""
    try:
        if not settings.OPENAI_API_KEY:
            return APITestResponse(
                success=False, 
                message="API key is not configured",
                api_key_configured=False
            )
        
        # Make a simple API call
        response = llm_client.generate_completion(
            messages=[
                {"role": "user", "content": "Hello from Gregify! This is a test message."}
            ],
            model=settings.DEFAULT_MODEL,
            max_tokens=100
        )
        
        if not response["success"]:
            return APITestResponse(
                success=False,
                message="API test failed",
                error=response.get("error", "Unknown error"),
                error_type=response.get("error_type", "Unknown error type"),
                api_key_configured=bool(settings.OPENAI_API_KEY)
            )
        
        return APITestResponse(
            success=True,
            message="API test successful",
            response=response["content"],
            model=response.get("model", settings.DEFAULT_MODEL),
            api_key_configured=bool(settings.OPENAI_API_KEY)
        )
    except Exception as e:
        return APITestResponse(
            success=False,
            message="Exception during API test",
            error=str(e),
            error_type=str(type(e).__name__),
            api_key_configured=bool(settings.OPENAI_API_KEY)
        )

@router.post("/normal-prompt", response_model=NormalPromptResponse, tags=["prompt"])
async def normal_prompt(request: PromptRequest):
    """
    Process a prompt directly with the LLM API.
    This is faster but provides a simpler enhancement compared to the multi-agent system.
    """
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API key is not configured. Please check your .env file."
        )
    
    result = await prompt_processor.process_with_direct_api(
        prompt=request.prompt,
        role=request.role,
        model=request.model
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("error", "Unknown error in prompt processing")
        )
    
    return NormalPromptResponse(
        success=True,
        response=result["response"],
        error=None
    )

@router.post("/process-prompt", response_model=PromptResponse, tags=["prompt"])
async def process_prompt(request: PromptRequest):
    """
    Process a prompt through the multi-agent system.
    This provides a more sophisticated enhancement but takes longer.
    """
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API key is not configured. Please check your .env file."
        )
    
    result = await prompt_processor.process_with_agents(
        prompt=request.prompt,
        role=request.role,
        session_id=request.sessionId
    )
    
    if not result["success"]:
        return PromptResponse(
            success=False,
            messages=result["messages"],
            final_prompt=result["final_prompt"],
            error=result["error"]
        )
    
    return PromptResponse(
        success=True,
        messages=result["messages"],
        final_prompt=result["final_prompt"],
        error=None
    ) 