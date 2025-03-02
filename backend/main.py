import os
import uuid
import traceback
import uvicorn
from typing import Dict, List, Optional, Union, Any
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
from agents.critic import CriticAgent
from agents.refiner import RefinerAgent
from agents.evaluator import EvaluatorAgent
from agents.config import ROLE_CONFIGS, BASE_CONFIG
from supabase import create_client

# Load environment variables from root .env file explicitly
root_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
print(f"Loading environment variables from: {root_env_path}")
load_dotenv(dotenv_path=root_env_path, override=True)

# Configure API client for DeepSeek
deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
if not deepseek_api_key:
    print("WARNING: No DeepSeek API key found in environment variables")
    print(f"Please ensure your .env file at {root_env_path} has DEEPSEEK_API_KEY set to your DeepSeek API key")
else:
    print(f"DeepSeek API key loaded successfully: {deepseek_api_key[:5]}... (length: {len(deepseek_api_key)})")

# Configure API client for OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("WARNING: No OpenAI API key found in environment variables")
    print("Please ensure you have a .env file with OPENAI_API_KEY set to your OpenAI API key")
else:
    print(f"OpenAI API key loaded successfully: {openai_api_key[:5]}... (length: {len(openai_api_key)})")

# Create global clients
deepseek_client = OpenAI(
    api_key=deepseek_api_key,
    base_url="https://api.deepseek.com/v1"
)

openai_client = OpenAI(
    api_key=openai_api_key,
    # Use default OpenAI base URL
)

app = FastAPI(
    title="Prompt Engineering Multi-Agent API",
    description="API for processing prompts through a multi-agent system using AutoGen",
    version="1.0.0"
)

# Add CORS middleware with more permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://bpoeahfpbjimmjjgjiojokbljpgpjjee",  # Your specific extension ID
        "chrome-extension://*",  # Generic pattern - may not work as expected
        "http://localhost:3000",
        "http://localhost:5173",
        "https://gregify-production.up.railway.app",  # Add your own production domain
        "*",  # Allow all origins - only use for development!
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],
    max_age=3600,
)

# Add a middleware to explicitly add CORS headers (will run after all other middlewares)
@app.middleware("http")
async def add_cors_headers(request, call_next):
    # Process the request and get the response
    response = await call_next(request)
    
    # Get the origin from the request
    origin = request.headers.get("origin", "")
    
    # Always add CORS headers, especially for /normal-prompt
    if origin == "chrome-extension://bpoeahfpbjimmjjgjiojokbljpgpjjee" or "/normal-prompt" in request.url.path:
        # Log that we're forcibly adding headers for debugging
        print(f"Forcibly adding CORS headers for {request.url.path} from origin {origin}")
        
        # Add the headers
        response.headers["Access-Control-Allow-Origin"] = "chrome-extension://bpoeahfpbjimmjjgjiojokbljpgpjjee"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    
    return response

# Add global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global exception handler caught: {str(exc)}")
    traceback.print_exc()
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc), "type": str(type(exc).__name__)},
    )

# Add logging middleware to debug CORS issues
@app.middleware("http")
async def log_requests(request, call_next):
    origin = request.headers.get('origin', '')
    print(f"Incoming request from origin: {origin}")
    print(f"Request method: {request.method}")
    print(f"Request path: {request.url.path}")
    
    # Log only important headers for debugging
    headers_to_log = {k: v for k, v in request.headers.items() 
                     if k.lower() in ['origin', 'content-type', 'accept', 'referer']}
    print(f"Request important headers: {headers_to_log}")
    
    response = await call_next(request)
    print(f"Response status code: {response.status_code}")
    
    # Don't manually set CORS headers here - let the CORS middleware handle it
    return response

# Add specific handler for OPTIONS requests to support CORS preflight
@app.options("/{rest_of_path:path}")
async def options_handler(request: Request, rest_of_path: str):
    return JSONResponse(
        content="OK",
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "status": "online",
        "endpoints": {
            "process-prompt": "/process-prompt (POST)",
            "normal-prompt": "/normal-prompt (POST)"
        },
        "available_roles": list(ROLE_CONFIGS.keys())
    }

@app.get("/health")
async def health_check():
    """Health check endpoint to verify API connectivity."""
    # Also check if the API key is configured
    if not deepseek_api_key:
        return {"status": "warning", "message": "Server is running but API key is missing"}
    
    return {
        "status": "healthy",
        "api_configured": bool(deepseek_api_key),
        "api_key_length": len(deepseek_api_key) if deepseek_api_key else 0,
        "roles_available": list(ROLE_CONFIGS.keys())
    }

@app.get("/test-api")
async def test_api(provider: str = "deepseek"):
    """Test endpoint to verify API connectivity."""
    try:
        if provider == "deepseek":
            if not deepseek_api_key:
                return {"success": False, "error": "DeepSeek API key is not configured"}
            
            # Make a simple API call with a standard DeepSeek model
            response = deepseek_client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "user", "content": "Hello from Gregify! This is a test message."}
                ],
                max_tokens=100
            )
            
            return {
                "success": True,
                "message": "DeepSeek API test successful",
                "response": response.choices[0].message.content,
                "model": response.model,
                "api_key_configured": bool(deepseek_api_key)
            }
        elif provider == "openai":
            if not openai_api_key:
                return {"success": False, "error": "OpenAI API key is not configured"}
            
            # Make a simple API call with GPT-4o mini
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "user", "content": "Hello from Gregify! This is a test message."}
                ],
                max_tokens=100
            )
            
            return {
                "success": True,
                "message": "OpenAI API test successful",
                "response": response.choices[0].message.content,
                "model": response.model,
                "api_key_configured": bool(openai_api_key)
            }
        else:
            return {
                "success": False,
                "error": f"Unknown provider: {provider}"
            }
    except Exception as e:
        error_trace = traceback.format_exc()
        
        return {
            "success": False,
            "error": str(e),
            "error_type": str(type(e).__name__),
            "traceback": error_trace,
            "api_key_configured": bool(deepseek_api_key if provider == "deepseek" else openai_api_key)
        }

class PromptRequest(BaseModel):
    prompt: str
    role: str
    model: str
    sessionId: str
    provider: str = "deepseek"  # Add provider field with default value

class AgentMessage(BaseModel):
    type: str
    content: str
    metadata: dict

class PromptResponse(BaseModel):
    success: bool
    messages: List[AgentMessage]
    final_prompt: str
    error: Optional[str] = None

class NormalPromptResponse(BaseModel):
    success: bool
    response: str
    error: Optional[str] = None

# Add an OPTIONS route handler to explicitly handle preflight requests
@app.options("/normal-prompt")
async def normal_prompt_options():
    """Handle OPTIONS preflight requests for normal-prompt endpoint."""
    return JSONResponse(
        content="OK",
        headers={
            "Access-Control-Allow-Origin": "chrome-extension://bpoeahfpbjimmjjgjiojokbljpgpjjee",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Origin",
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.post("/normal-prompt")
async def normal_prompt(request: PromptRequest) -> NormalPromptResponse:
    """Process a prompt directly using the specified AI model."""
    try:
        # Validate role
        if request.role not in ROLE_CONFIGS:
            print(f"Invalid role: {request.role}")
            return JSONResponse(
                content=NormalPromptResponse(
                    success=False,
                    response="",
                    error=f"Invalid role: {request.role}"
                ).dict(),
                headers={
                    "Access-Control-Allow-Origin": "chrome-extension://bpoeahfpbjimmjjgjiojokbljpgpjjee",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Origin",
                }
            )
        
        # Get the role config
        role_config = ROLE_CONFIGS[request.role]
        print(f"Role config keys: {role_config.keys()}")
        
        # Use the provider from the request (falls back to default "deepseek")
        provider = request.provider
        print(f"Using provider: {provider}")
        print(f"Selected model for prompt optimization: {request.model}")
        
        # Initialize provider clients to None
        user_deepseek_client = None
        user_openai_client = None
        
        # Get user ID from session if available
        user_id = None
        if request.sessionId:
            try:
                # Try to extract user ID from session
                supabase_url = os.getenv('VITE_SUPABASE_URL')
                supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
                
                if not supabase_url or not supabase_key:
                    print(f"ERROR: Missing Supabase configuration - URL: {supabase_url}, Key: {supabase_key[:10] if supabase_key else None}")
                    return JSONResponse(
                        content=NormalPromptResponse(
                            success=False,
                            response="",
                            error="Server configuration error: Missing Supabase credentials"
                        ).dict(),
                        headers={
                            "Access-Control-Allow-Origin": "chrome-extension://bpoeahfpbjimmjjgjiojokbljpgpjjee",
                            "Access-Control-Allow-Credentials": "true",
                            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Origin",
                        }
                    )
                
                print(f"Creating Supabase client with URL: {supabase_url}")
                # Check if we have a service role key for higher privileges (recommended for accessing sensitive data)
                service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
                if service_role_key:
                    print("Using service role key for database access (higher privileges)")
                    supabase_client = create_client(supabase_url, service_role_key)
                else:
                    print("WARNING: Using anon key for database access - service role key recommended for API key retrieval")
                    # Fall back to anon key if service role key not available
                    supabase_client = create_client(supabase_url, supabase_key)
                
                # Use the session ID directly as the user ID
                user_id = request.sessionId
                print(f"Using session ID as user_id: {user_id}")
                
                # Retrieve the user's API keys
                try:
                    api_keys_result = supabase_client.table('user_api_keys').select(
                        'openai_api_key, deepseek_api_key'
                    ).eq('user_id', user_id).execute()
                    
                    print(f"API keys query result: {api_keys_result}")
                    
                    if api_keys_result.data and len(api_keys_result.data) > 0:
                        user_api_keys = api_keys_result.data[0]
                        print(f"Found user API keys: OpenAI: {'Yes' if user_api_keys.get('openai_api_key') else 'No'}, DeepSeek: {'Yes' if user_api_keys.get('deepseek_api_key') else 'No'}")
                        
                        # Use the user's API key based on the provider
                        if provider == "deepseek":
                            if user_api_keys.get('deepseek_api_key'):
                                user_deepseek_key = user_api_keys.get('deepseek_api_key')
                                user_deepseek_client = OpenAI(api_key=user_deepseek_key, base_url="https://api.deepseek.com/v1")
                                print(f"Using user's DeepSeek API key: {user_deepseek_key[:5]}...")
                            else:
                                print("User has no DeepSeek API key")
                                return JSONResponse(
                                    content=NormalPromptResponse(
                                        success=False,
                                        response="",
                                        error="You need to add your DeepSeek API key in settings to use DeepSeek models"
                                    ).dict(),
                                    headers={
                                        "Access-Control-Allow-Origin": "chrome-extension://bpoeahfpbjimmjjgjiojokbljpgpjjee",
                                        "Access-Control-Allow-Credentials": "true",
                                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                                        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Origin",
                                    }
                                )
                                
                        elif provider == "openai":
                            if user_api_keys.get('openai_api_key'):
                                user_openai_key = user_api_keys.get('openai_api_key')
                                user_openai_client = OpenAI(api_key=user_openai_key)
                                print(f"Using user's OpenAI API key: {user_openai_key[:5]}...")
                            else:
                                print("User has no OpenAI API key")
                                return JSONResponse(
                                    content=NormalPromptResponse(
                                        success=False,
                                        response="",
                                        error="You need to add your OpenAI API key in settings to use OpenAI models"
                                    ).dict(),
                                    headers={
                                        "Access-Control-Allow-Origin": "chrome-extension://bpoeahfpbjimmjjgjiojokbljpgpjjee",
                                        "Access-Control-Allow-Credentials": "true",
                                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                                        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Origin",
                                    }
                                )
                    else:
                        print(f"No API keys found for user ID: {user_id}")
                        return NormalPromptResponse(
                            success=False,
                            response="",
                            error="No API keys found. Please add your API keys in your profile settings."
                        )
                except Exception as db_error:
                    print(f"Database error retrieving API keys: {str(db_error)}")
                    traceback.print_exc()
                    return NormalPromptResponse(
                        success=False,
                        response="",
                        error=f"Error retrieving your API keys: {str(db_error)}"
                    )
                    
            except Exception as e:
                print(f"Error retrieving user API keys: {str(e)}")
                traceback.print_exc()
                return NormalPromptResponse(
                    success=False,
                    response="",
                    error=f"Authentication error: {str(e)}"
                )
        else:
            print("No session ID provided")
            return NormalPromptResponse(
                success=False,
                response="",
                error="No session ID provided. Please log in to use this feature."
            )
        
        # Select the appropriate client based on provider
        client = None
        if provider == "deepseek":
            # Use user's client (we've validated it exists above)
            client = user_deepseek_client
            api_model = "deepseek-chat"  # Model to use with DeepSeek API
            print(f"Using DeepSeek client with model: {api_model}")
        elif provider == "openai":
            # Use user's client (we've validated it exists above)
            client = user_openai_client
            api_model = "gpt-4o-mini"  # Model to use with OpenAI API
            print(f"Using OpenAI client with model: {api_model}")
        else:
            return NormalPromptResponse(
                success=False,
                response="",
                error=f"Unknown provider: {provider}"
            )
        
        print(f"Using {provider.upper()} for this request")
        
        # Construct system message from role config
        system_message = role_config.get("system_message", "")
        if not system_message:
            print("WARNING: No system message found in role config")
            system_message = "You are a helpful assistant."
        
        # Construct user prompt message
        user_prompt = request.prompt
        
        print(f"System message: {system_message[:50]}...")
        print(f"User prompt: {user_prompt[:50]}...")
        
        try:
            # Create the completion using the selected client
            response = client.chat.completions.create(
                model=api_model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": f"""Please enhance the following prompt:

{user_prompt}

Remember to strictly follow the format specified in your instructions, with separate 'Enhanced Prompt:' and 'Explanation:' sections."""}
                ],
                temperature=0.5,  # Lower temperature for more consistent formatting
                max_tokens=1500
            )
            
            # Extract the response
            response_text = response.choices[0].message.content
            
            print(f"Received response from {provider} (first 100 chars): {response_text[:100]}...")
            
            return JSONResponse(
                content=NormalPromptResponse(
                    success=True,
                    response=response_text,
                    error=None
                ).dict(),
                headers={
                    "Access-Control-Allow-Origin": "chrome-extension://bpoeahfpbjimmjjgjiojokbljpgpjjee",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Origin",
                }
            )
        except Exception as api_error:
            # Log detailed API error
            print(f"ERROR in {provider} API call: {str(api_error)}")
            print(f"API error type: {type(api_error).__name__}")
            
            return JSONResponse(
                content=NormalPromptResponse(
                    success=False,
                    response="",
                    error=f"{provider.upper()} API Error: {str(api_error)}"
                ).dict(),
                headers={
                    "Access-Control-Allow-Origin": "chrome-extension://bpoeahfpbjimmjjgjiojokbljpgpjjee",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Origin",
                }
            )
    except Exception as e:
        print(f"General error in normal_prompt: {str(e)}")
        return JSONResponse(
            content=NormalPromptResponse(
                success=False,
                response="",
                error=f"Error: {str(e)}"
            ).dict(),
            headers={
                "Access-Control-Allow-Origin": "chrome-extension://bpoeahfpbjimmjjgjiojokbljpgpjjee",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Origin",
            }
        )

@app.post("/process-prompt")
async def process_prompt(request: PromptRequest) -> PromptResponse:
    """Process a prompt through the multi-agent system."""
    # Commenting out MAS mode as requested
    """
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
    """
    # Return a response indicating MAS mode is disabled
    return PromptResponse(
        success=False,
        messages=[],
        final_prompt="",
        error="MAS mode is currently disabled. Please use normal mode instead."
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
