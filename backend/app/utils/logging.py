"""
Logging utilities for structured logging throughout the application.
"""
import sys
import os
import logging
from loguru import logger
from typing import Dict, Any, Callable

# Configure loguru logger
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)

# Remove default loguru handler
logger.remove()

# Add custom handler with format
logger.add(
    sys.stderr,
    format=LOG_FORMAT,
    level=LOG_LEVEL,
    colorize=True,
)

# Add file handler for production
if os.getenv("ENVIRONMENT", "development") == "production":
    LOG_FILE = os.getenv("LOG_FILE", "logs/gregify.log")
    
    # Ensure log directory exists
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    
    # Add file handler
    logger.add(
        LOG_FILE,
        format=LOG_FORMAT,
        level=LOG_LEVEL,
        rotation="10 MB",
        retention="1 week",
        compression="zip",
    )

# Create FastAPI compatible logger
class InterceptHandler(logging.Handler):
    """
    Intercepts standard logging messages and redirects them to loguru.
    This allows compatibility with FastAPI's logging system.
    """
    
    def emit(self, record: logging.LogRecord) -> None:
        # Get corresponding loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno
            
        # Find caller from where the logged message originated
        frame, depth = sys._getframe(6), 6
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1
            
        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )

# Configure logging for FastAPI
def setup_fastapi_logging() -> None:
    """Configure logging for FastAPI and other libraries."""
    # Intercept standard library logging
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    # Replace standard library loggers with loguru
    for name in logging.root.manager.loggerDict.keys():
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True

# Function to create a context logger
def get_logger(name: str) -> Callable:
    """
    Get a logger for a specific context (module/class).
    
    Args:
        name: The name of the context
        
    Returns:
        A logger function
    """
    def _log(message: str, level: str = "INFO", **kwargs: Dict[str, Any]) -> None:
        """
        Log a message with context.
        
        Args:
            message: The message to log
            level: The log level
            **kwargs: Additional context to include in the log
        """
        log_func = getattr(logger, level.lower())
        log_func(f"{message} | {kwargs if kwargs else ''}")
    
    return _log

# Export the main logger
app_logger = logger 