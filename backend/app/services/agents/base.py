from typing import Dict, Any, Optional, List
import autogen
from ...core.agent_config import get_agent_config

class BaseAgent:
    """Base class for all agents in the multi-agent system."""
    
    def __init__(self, agent_type: str, role: str):
        """
        Initialize the base agent.
        
        Args:
            agent_type: Type of agent (critic, refiner, evaluator)
            role: The role context (webdev, syseng, analyst, designer)
        """
        self.agent_type = agent_type
        self.role = role
        self.config = get_agent_config(agent_type, role)
        
        # Initialize the AutoGen agent
        self.agent = autogen.AssistantAgent(
            name=self.config["name"],
            system_message=self.config["system_message"],
            llm_config={
                "config_list": self.config["config_list"],
                "temperature": self.config.get("temperature", 0.7),
                "seed": self.config.get("seed", 42),
            },
        )
        
        # Initialize the user proxy for agent interactions
        self.user_proxy = autogen.UserProxyAgent(
            name="user_proxy",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=1,
            code_execution_config={"work_dir": "coding", "use_docker": False},
        )
    
    async def process(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process the prompt and return the agent's response.
        
        Args:
            prompt: The prompt to process
            context: Additional context for the agent
            
        Returns:
            A dictionary with the agent's response
        """
        try:
            # Prepare the message with context
            message = self._prepare_message(prompt, context)
            
            # Start a conversation
            self.user_proxy.initiate_chat(
                self.agent,
                message=message,
            )
            
            # Get the last message from the conversation
            last_message = self.user_proxy.last_message()
            
            # Handle different response formats
            if last_message is None:
                raise Exception(f"No response received from {self.agent_type} agent")
            
            # Extract content from AutoGen response
            if isinstance(last_message, dict):
                # Handle AutoGen's dictionary response format
                content = last_message.get('content', '')
                if not content and 'message' in last_message:
                    content = last_message['message']
            else:
                # Handle string or other response types
                content = str(last_message)
            
            if not content:
                raise Exception(f"Empty response from {self.agent_type} agent")
            
            # Process and structure the response
            response = self._process_response(content)
            
            return {
                "success": True,
                "message": str(response.get("content", "")),
                "metadata": {
                    "confidence": float(response.get("confidence", 0.8)),
                    "suggestions": list(response.get("suggestions", [])),
                    "role": self.role,
                    "agent_type": self.agent_type,
                    "analysis": response.get("analysis", {}),
                },
            }
            
        except Exception as e:
            print(f"Error in {self.agent_type} agent: {str(e)}")
            print(f"Context: {context}")
            return {
                "success": False,
                "error": f"{self.agent_type} agent error: {str(e)}",
                "metadata": {
                    "role": self.role,
                    "agent_type": self.agent_type,
                },
            }
    
    def _prepare_message(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Prepare the message for the agent with context.
        
        Args:
            prompt: The prompt to process
            context: Additional context for the agent
            
        Returns:
            The formatted message
        """
        message = f"Process this prompt: {prompt}"
        
        if context:
            message += "\n\nContext:"
            for key, value in context.items():
                message += f"\n{key}: {value}"
        
        return message
    
    def _process_response(self, response: str) -> Dict[str, Any]:
        """
        Process the agent's response into a structured format.
        
        Args:
            response: The raw response from the agent
            
        Returns:
            A structured response
        """
        # This is a basic implementation. Subclasses should override this.
        return {
            "content": response,
            "confidence": 0.8,
            "suggestions": [],
        }
    
    def terminate(self):
        """Clean up any resources."""
        if hasattr(self, 'agent'):
            self.agent.reset()
        if hasattr(self, 'user_proxy'):
            self.user_proxy.reset() 