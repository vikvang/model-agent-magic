#!/usr/bin/env python
"""
Entry point for running the Gregify backend server.
"""
import uvicorn
import os
import sys
from dotenv import load_dotenv

# Add the current directory to the path so that 'app' can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Get the port from environment variable or use default
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")

if __name__ == "__main__":
    print(f"Starting Gregify API server on {HOST}:{PORT}")
    print("Press Ctrl+C to stop")
    
    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=True,
        log_level="info",
    ) 