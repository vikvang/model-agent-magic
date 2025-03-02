"""
Unit tests for the API endpoints.
"""
import pytest
import json

def test_root_endpoint(client):
    """Test the root endpoint returns expected information."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    
    # Check structure
    assert "status" in data
    assert "endpoints" in data
    assert "available_roles" in data
    
    # Check content
    assert data["status"] == "online"
    assert "process-prompt" in data["endpoints"]
    assert "normal-prompt" in data["endpoints"]
    assert isinstance(data["available_roles"], list)
    assert len(data["available_roles"]) > 0

def test_health_endpoint(client):
    """Test the health check endpoint returns expected information."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    
    # Check structure
    assert "status" in data
    assert "api_configured" in data
    assert "api_key_length" in data
    assert "roles_available" in data
    
    # Check types
    assert isinstance(data["status"], str)
    assert isinstance(data["api_configured"], bool)
    assert isinstance(data["api_key_length"], int)
    assert isinstance(data["roles_available"], list)

def test_normal_prompt_endpoint(client, mock_llm_client, test_roles, test_prompts, test_session_id):
    """Test the normal prompt endpoint returns expected results."""
    role = test_roles[0]
    prompt = test_prompts[0]
    
    response = client.post(
        "/normal-prompt",
        json={
            "prompt": prompt,
            "role": role,
            "model": "sonar",
            "sessionId": test_session_id
        }
    )
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    
    # Check structure
    assert "success" in data
    assert "response" in data
    assert data["success"] is True
    assert isinstance(data["response"], str)
    
    # Check LLM client was called correctly
    calls = mock_llm_client.get_calls()
    assert len(calls) == 1
    assert calls[0]["model"] == "sonar"
    assert len(calls[0]["messages"]) == 2  # System and user messages
    assert calls[0]["messages"][1]["content"].startswith(f"Original prompt: {prompt}")

def test_invalid_role(client, test_prompts, test_session_id):
    """Test that invalid roles return an appropriate error."""
    response = client.post(
        "/normal-prompt",
        json={
            "prompt": test_prompts[0],
            "role": "invalid_role",
            "model": "sonar",
            "sessionId": test_session_id
        }
    )
    
    # API should handle invalid roles gracefully
    assert response.status_code == 500  # Internal server error
    data = response.json()
    assert "detail" in data
    assert "Invalid role" in data["detail"]

def test_process_prompt_endpoint(client, mock_llm_client, test_roles, test_prompts, test_session_id, monkeypatch):
    """Test the multi-agent prompt processing endpoint."""
    # Mock the prompt processor service
    class MockPromptProcessor:
        async def process_with_agents(self, prompt, role, session_id):
            return {
                "success": True,
                "messages": [
                    {
                        "type": "critique",
                        "content": "This is a critique of the prompt.",
                        "metadata": {"agent": "critic", "role": role}
                    },
                    {
                        "type": "refinement",
                        "content": "This is a refined prompt.",
                        "metadata": {"agent": "refiner", "role": role}
                    },
                    {
                        "type": "evaluation",
                        "content": "This is an evaluation of the refined prompt.",
                        "metadata": {"agent": "evaluator", "role": role}
                    }
                ],
                "final_prompt": "This is the final enhanced prompt.",
                "error": None
            }
    
    # Replace prompt_processor with mock
    monkeypatch.setattr("app.api.endpoints.prompt_processor", MockPromptProcessor())
    
    # Test the endpoint
    response = client.post(
        "/process-prompt",
        json={
            "prompt": test_prompts[0],
            "role": test_roles[0],
            "model": "sonar",
            "sessionId": test_session_id
        }
    )
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    
    # Check structure
    assert "success" in data
    assert "messages" in data
    assert "final_prompt" in data
    assert data["success"] is True
    assert len(data["messages"]) == 3
    assert data["final_prompt"] == "This is the final enhanced prompt." 