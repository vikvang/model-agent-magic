"""
Common pytest fixtures and configurations for all tests.
"""
import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add the parent directory to the path so that 'app' can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import after path is configured
from app.main import app
from app.core.config import settings
from app.services import llm_client

# Create a test client fixture
@pytest.fixture
def client():
    """Create a test client for FastAPI."""
    return TestClient(app)

# Mock LLM client fixture
@pytest.fixture
def mock_llm_client(monkeypatch):
    """Mock the LLM client for testing."""
    class MockLLMClient:
        def __init__(self):
            self.calls = []
            
        def generate_completion(self, messages, model=None, temperature=None, max_tokens=None):
            """Mock completion generation that records calls and returns a successful response."""
            self.calls.append({
                "messages": messages,
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens,
            })
            
            return {
                "success": True,
                "content": "This is a mock response from the LLM client.",
                "model": model or settings.DEFAULT_MODEL,
                "metadata": {
                    "finish_reason": "stop",
                    "model": model or settings.DEFAULT_MODEL,
                }
            }
        
        def get_calls(self):
            """Get the list of recorded calls."""
            return self.calls

    mock_client = MockLLMClient()
    monkeypatch.setattr("app.services.llm_client", mock_client)
    return mock_client

# Test roles fixture
@pytest.fixture
def test_roles():
    """Provide a list of valid test roles."""
    return ["webdev", "syseng", "analyst", "designer"]

# Test prompts fixture
@pytest.fixture
def test_prompts():
    """Provide a list of test prompts."""
    return [
        "How do I create a responsive layout in CSS?",
        "What's the best way to deploy a Flask application?",
        "How can I visualize data from a pandas DataFrame?",
        "What are the principles of good UI design?",
    ]

# Test session ID fixture
@pytest.fixture
def test_session_id():
    """Provide a test session ID."""
    return "test-session-123" 