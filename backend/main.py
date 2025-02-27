from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import openai
import os
from agents.critic import CriticAgent
from agents.refiner import RefinerAgent
from agents.evaluator import EvaluatorAgent
from agents.config import ROLE_CONFIGS, BASE_CONFIG

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
client = openai

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
        "http://localhost:8080",
        "http://127.0.0.1:8081",
        "chrome-extension://*",
        "*",
        # "chrome-extension://aehjnebcjlbfheinfbkbjkfknpkmfaca", # personal extension id
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Origin", "Accept", "Authorization"],
    expose_headers=["*"],
    max_age=3600,
)

# Add logging middleware to debug CORS issues
@app.middleware("http")
async def log_requests(request, call_next):
    origin = request.headers.get('origin', '')
    print(f"Incoming request from origin: {origin}")
    print(f"Request method: {request.method}")
    print(f"Request headers: {request.headers}")
    
    # For Chrome extensions, we need to ensure the response has the correct CORS headers
    response = await call_next(request)
    if origin.startswith('chrome-extension://'):
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        if request.method == 'OPTIONS':
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Origin, Accept, Authorization'
    
    return response

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
        
        messages = []
        try:
            # Process through critic
            critic_result = await critic.process(request.prompt)
            print("Critic result:", critic_result)  # Debug log
            
            if not critic_result["success"]:
                raise Exception(f"Critic agent failed: {critic_result.get('error')}")
            
            # Create critic message
            critic_message = {
                "type": "critic",
                "content": critic_result["message"],
                "metadata": critic_result["metadata"]
            }
            messages.append(critic_message)
            
            # Process through refiner with critic's context
            refiner_result = await refiner.process(
                request.prompt,
                context={"critic_analysis": critic_result["metadata"].get("analysis", {})}
            )
            print("Refiner result:", refiner_result)  # Debug log
            
            if not refiner_result["success"]:
                raise Exception(f"Refiner agent failed: {refiner_result.get('error')}")
            
            # Create refiner message
            refiner_message = {
                "type": "refiner",
                "content": refiner_result["message"],
                "metadata": refiner_result["metadata"]
            }
            messages.append(refiner_message)
            
            # Process through evaluator with full context
            evaluator_result = await evaluator.process(
                request.prompt,
                context={
                    "critic_analysis": critic_result["metadata"].get("analysis", {}),
                    "refinement": refiner_result["metadata"].get("refinement", {})
                }
            )
            print("Evaluator result:", evaluator_result)  # Debug log
            
            if not evaluator_result["success"]:
                raise Exception(f"Evaluator agent failed: {evaluator_result.get('error')}")
            
            # Create evaluator message
            evaluator_message = {
                "type": "evaluator",
                "content": evaluator_result["message"],
                "metadata": evaluator_result["metadata"]
            }
            messages.append(evaluator_message)
            
        finally:
            # Clean up agents
            critic.terminate()
            refiner.terminate()
            evaluator.terminate()
        
        # Return successful response
        return PromptResponse(
            success=True,
            messages=messages,
            final_prompt=evaluator_result["message"] if evaluator_result["success"] else ""
        )
        
    except Exception as e:
        print(f"Error in process_prompt: {str(e)}")  # Debug log
        return PromptResponse(
            success=False,
            messages=[],
            final_prompt="",
            error=str(e)
        )

class FastPromptRequest(BaseModel):
    prompt: str
    role: str
    model: str
    sessionId: str

class FastPromptResponse(BaseModel):
    success: bool
    improved_prompt: str
    error: Optional[str] = None

@app.post("/fast-prompt")
async def fast_prompt(request: FastPromptRequest) -> FastPromptResponse:
    """Quickly improve a prompt without using the full multi-agent system."""
    try:
        # Validate role
        if request.role not in ROLE_CONFIGS:
            raise HTTPException(status_code=400, detail=f"Invalid role: {request.role}")
        
        # Get role-specific context
        role_context = ROLE_CONFIGS[request.role]["system_message"]
        
        # Create a simple prompt for improvement
        system_message = f"""You are an expert prompt engineer specializing in {request.role} tasks.
Your job is to quickly improve the user's prompt to be more effective.
Focus on clarity, specificity, and technical accuracy for {request.role}.
Provide ONLY the improved prompt with no explanations or additional text."""
        
        # Call the API directly for faster response
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",  # Using a faster model for quick results
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": f"Improve this prompt: {request.prompt}"}
                ],
                temperature=0.7,
                max_tokens=1024,
            )
            
            improved_prompt = response.choices[0].message.content.strip()
            
            return FastPromptResponse(
                success=True,
                improved_prompt=improved_prompt
            )
            
        except Exception as api_error:
            print(f"API error: {str(api_error)}")
            raise Exception(f"Error calling AI API: {str(api_error)}")
        
    except Exception as e:
        print(f"Error in fast_prompt: {str(e)}")
        return FastPromptResponse(
            success=False,
            improved_prompt="",
            error=str(e)
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
