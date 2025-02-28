import traceback
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from .api import api_router
from .api.auth_endpoints import router as auth_router
from .core.config import settings
from .utils import app_logger, setup_fastapi_logging
from .services.supabase_client import supabase_service
from . import __version__

# Setup logging
setup_fastapi_logging()

# Create the FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=__version__,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
    expose_headers=["*"],
    max_age=3600,
)

# Add global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled exceptions."""
    error_msg = f"Global exception handler caught: {str(exc)}"
    app_logger.error(f"{error_msg}\n{traceback.format_exc()}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc), "type": str(type(exc).__name__)},
    )

# Add logging middleware to debug request issues
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log important information about incoming requests."""
    origin = request.headers.get('origin', '')
    path = request.url.path
    method = request.method
    
    # Log the request
    app_logger.info(
        f"Request: {method} {path}",
        origin=origin,
        headers={
            k: v for k, v in request.headers.items()
            if k.lower() in ['origin', 'content-type', 'accept', 'referer']
        }
    )
    
    # Process the request
    response = await call_next(request)
    
    # Log the response
    app_logger.info(
        f"Response: {response.status_code} - {method} {path}",
        status_code=response.status_code
    )
    
    return response

# Include the API routers
app.include_router(api_router)
app.include_router(auth_router, prefix="/auth")

# Validate settings on startup
@app.on_event("startup")
async def startup_event():
    """Validate settings on startup."""
    settings.validate()
    app_logger.info(f"Starting {settings.PROJECT_NAME} v{__version__}")
    app_logger.info(f"Environment: {settings.ENVIRONMENT}")
    app_logger.info(f"API configured: {bool(settings.OPENAI_API_KEY)}")
    app_logger.info(f"Supabase configured: {supabase_service.is_configured()}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    app_logger.info(f"Shutting down {settings.PROJECT_NAME}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app", 
        host=settings.HOST, 
        port=settings.PORT,
        reload=True
    ) 