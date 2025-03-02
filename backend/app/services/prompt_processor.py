from typing import Dict, List, Any, Optional
import uuid
import asyncio
from ..models.api_models import AgentMessage
from .agents import CriticAgent, RefinerAgent, EvaluatorAgent
from .llm_client import llm_client
from ..core.config import settings

class PromptProcessorService:
    """
    Service for processing prompts through the multi-agent system.
    Coordinates the three agents: Critic, Refiner, and Evaluator.
    """
    
    async def process_with_agents(
        self, 
        prompt: str, 
        role: str,
        session_id: str,
    ) -> Dict[str, Any]:
        """
        Process a prompt through the multi-agent system.
        
        Args:
            prompt: The prompt to process
            role: The role context for the prompt
            session_id: Unique session identifier
            
        Returns:
            A dictionary with the processing results
        """
        try:
            messages = []
            
            # Create a unique correlation ID for this request
            correlation_id = f"{session_id}-{uuid.uuid4()}"
            
            # Step 1: Create and run critic agent
            critic_agent = CriticAgent(role)
            critic_result = await critic_agent.process(prompt)
            
            if not critic_result["success"]:
                return {
                    "success": False,
                    "messages": [{
                        "type": "error",
                        "content": f"Critic agent error: {critic_result.get('error', 'Unknown error')}",
                        "metadata": {
                            "agent": "critic",
                            "role": role,
                            "correlation_id": correlation_id,
                        }
                    }],
                    "final_prompt": prompt,
                    "error": critic_result.get("error", "Unknown error in critic agent"),
                }
            
            # Add critic message
            messages.append(AgentMessage(
                type="critique",
                content=critic_result["message"],
                metadata={
                    "agent": "critic",
                    "role": role,
                    "confidence": critic_result["metadata"]["confidence"],
                    "correlation_id": correlation_id,
                }
            ))
            
            # Step 2: Create and run refiner agent with critic feedback
            refiner_agent = RefinerAgent(role)
            refiner_result = await refiner_agent.process(
                prompt,
                {"critic_feedback": critic_result["message"]}
            )
            
            if not refiner_result["success"]:
                return {
                    "success": False,
                    "messages": messages + [{
                        "type": "error",
                        "content": f"Refiner agent error: {refiner_result.get('error', 'Unknown error')}",
                        "metadata": {
                            "agent": "refiner",
                            "role": role,
                            "correlation_id": correlation_id,
                        }
                    }],
                    "final_prompt": prompt,
                    "error": refiner_result.get("error", "Unknown error in refiner agent"),
                }
            
            # Add refiner message
            messages.append(AgentMessage(
                type="refinement",
                content=refiner_result["message"],
                metadata={
                    "agent": "refiner",
                    "role": role,
                    "confidence": refiner_result["metadata"]["confidence"],
                    "suggestions": refiner_result["metadata"].get("suggestions", []),
                    "correlation_id": correlation_id,
                }
            ))
            
            # The refined prompt is the message from the refiner
            refined_prompt = refiner_result["message"]
            
            # Step 3: Create and run evaluator agent with original and refined prompts
            evaluator_agent = EvaluatorAgent(role)
            evaluator_result = await evaluator_agent.process(
                refined_prompt,
                {
                    "original_prompt": prompt,
                    "critic_feedback": critic_result["message"],
                }
            )
            
            # Add evaluator message
            messages.append(AgentMessage(
                type="evaluation",
                content=evaluator_result["message"] if evaluator_result["success"] else "Evaluation failed",
                metadata={
                    "agent": "evaluator",
                    "role": role,
                    "confidence": evaluator_result["metadata"]["confidence"] if evaluator_result["success"] else 0.0,
                    "suggestions": evaluator_result["metadata"].get("suggestions", []) if evaluator_result["success"] else [],
                    "correlation_id": correlation_id,
                }
            ))
            
            # Clean up agents
            critic_agent.terminate()
            refiner_agent.terminate()
            evaluator_agent.terminate()
            
            return {
                "success": True,
                "messages": messages,
                "final_prompt": refined_prompt,
                "error": None,
            }
            
        except Exception as e:
            print(f"Error in multi-agent processing: {str(e)}")
            return {
                "success": False,
                "messages": [{
                    "type": "error",
                    "content": f"Error in multi-agent processing: {str(e)}",
                    "metadata": {
                        "correlation_id": session_id,
                    }
                }],
                "final_prompt": prompt,
                "error": str(e),
            }
    
    async def process_with_direct_api(
        self, 
        prompt: str, 
        role: str,
        model: str = None,
    ) -> Dict[str, Any]:
        """
        Process a prompt directly with the LLM API.
        
        Args:
            prompt: The prompt to process
            role: The role context for the prompt
            model: The model to use (optional)
            
        Returns:
            A dictionary with the processing results
        """
        try:
            from ..core.agent_config import ROLE_CONFIGS
            
            # Validate role
            if role not in ROLE_CONFIGS:
                return {
                    "success": False,
                    "response": "",
                    "error": f"Invalid role: {role}"
                }
            
            # Get the role config
            role_config = ROLE_CONFIGS[role]
            
            # Create a clear system message that emphasizes prompt enhancement
            system_message = f"""You are a prompt optimization expert specializing in {role} topics. Your task is to IMPROVE the given prompt, not to answer it. 
            
            Focus on making the original prompt:
            1. More specific and detailed
            2. Better structured
            3. More likely to get a high-quality response
            4. Include relevant context and constraints
            
            Role-specific guidance for {role}:
            {role_config.get('system_message', 'Optimize for clarity and specificity in this domain.')}
            
            DO NOT answer the prompt's question - instead, rewrite it to be a better prompt.
            
            Your response should be in this format:
            "Enhanced prompt: [your improved version of the prompt]"
            
            Followed by a brief explanation of what you improved and why.
            """
            
            user_prompt = f"Original prompt: {prompt}\nRole context: I am asking as a {role}."
            
            # Call the LLM API
            response = llm_client.generate_completion(
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_prompt}
                ],
                model=model or settings.DEFAULT_MODEL,
                temperature=0.7,
                max_tokens=1500
            )
            
            if not response["success"]:
                return {
                    "success": False,
                    "response": "",
                    "error": response.get("error", "Unknown error in API call")
                }
            
            return {
                "success": True,
                "response": response["content"],
                "error": None
            }
            
        except Exception as e:
            print(f"Error in direct API processing: {str(e)}")
            return {
                "success": False,
                "response": "",
                "error": str(e)
            }

# Create a global prompt processor instance
prompt_processor = PromptProcessorService() 