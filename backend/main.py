from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from agents.critic import CriticAgent
from agents.refiner import RefinerAgent
from agents.evaluator import EvaluatorAgent
from agents.config import ROLE_CONFIGS

app = FastAPI(
    title="Prompt Engineering Multi-Agent API",
    description="API for processing prompts through a multi-agent system using AutoGen",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "status": "online",
        "endpoints": {
            "process-prompt": "/process-prompt (POST)",
        },
        "available_roles": list(ROLE_CONFIGS.keys())
    }

class PromptRequest(BaseModel):
    prompt: str
    role: str
    model: str
    sessionId: str

class AgentMessage(BaseModel):
    type: str
    content: str
    metadata: dict

class PromptResponse(BaseModel):
    success: bool
    messages: List[AgentMessage]
    final_prompt: str
    error: Optional[str] = None

@app.post("/process-prompt")
async def process_prompt(request: PromptRequest) -> PromptResponse:
    """Process a prompt through the multi-agent system."""
    try:
        # Validate role
        if request.role not in ROLE_CONFIGS:
            raise HTTPException(status_code=400, detail=f"Invalid role: {request.role}")
        
        # Initialize agents
        critic = CriticAgent(request.role)
        refiner = RefinerAgent(request.role)
        evaluator = EvaluatorAgent(request.role)
        
        # Process through critic
        critic_result = await critic.process(request.prompt)
        if not critic_result["success"]:
            raise Exception(f"Critic agent failed: {critic_result.get('error')}")
        
        # Process through refiner with critic's context
        refiner_result = await refiner.process(
            request.prompt,
            context={"critic_analysis": critic_result["metadata"].get("analysis", {})}
        )
        if not refiner_result["success"]:
            raise Exception(f"Refiner agent failed: {refiner_result.get('error')}")
        
        # Process through evaluator with full context
        evaluator_result = await evaluator.process(
            request.prompt,
            context={
                "critic_analysis": critic_result["metadata"].get("analysis", {}),
                "refinement": refiner_result["metadata"].get("refinement", {})
            }
        )
        if not evaluator_result["success"]:
            raise Exception(f"Evaluator agent failed: {evaluator_result.get('error')}")
        
        # Clean up agents
        critic.terminate()
        refiner.terminate()
        evaluator.terminate()
        
        # Prepare response
        messages = [
            AgentMessage(
                type="critic",
                content=critic_result["message"],
                metadata={
                    k: v for k, v in critic_result["metadata"].items()
                    if k not in ["analysis"]  # Exclude internal data
                }
            ),
            AgentMessage(
                type="refiner",
                content=refiner_result["message"],
                metadata={
                    k: v for k, v in refiner_result["metadata"].items()
                    if k not in ["refinement"]  # Exclude internal data
                }
            ),
            AgentMessage(
                type="evaluator",
                content=evaluator_result["message"],
                metadata={
                    k: v for k, v in evaluator_result["metadata"].items()
                    if k not in ["evaluation"]  # Exclude internal data
                }
            )
        ]
        
        return PromptResponse(
            success=True,
            messages=messages,
            final_prompt=evaluator_result["content"]
        )
        
    except Exception as e:
        return PromptResponse(
            success=False,
            messages=[],
            final_prompt="",
            error=str(e)
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
