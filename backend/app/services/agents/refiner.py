from typing import Dict, Any, List, Optional
import re
from .base import BaseAgent

class RefinerAgent(BaseAgent):
    """
    Refiner agent responsible for improving prompts based on the Critic's feedback.
    This agent takes the original prompt and the Critic's analysis to create an enhanced version.
    """
    
    def __init__(self, role: str):
        """
        Initialize the Refiner agent.
        
        Args:
            role: The role context (webdev, syseng, analyst, designer)
        """
        super().__init__("refiner", role)
    
    async def process(
        self, 
        prompt: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process the prompt with critic feedback and return the refined prompt.
        
        Args:
            prompt: The original prompt to refine
            context: Additional context, including the critic's feedback
            
        Returns:
            A dictionary with the refined prompt
        """
        if not context or "critic_feedback" not in context:
            # If there's no critic feedback, add a note about it
            context = context or {}
            context["note"] = "No critic feedback provided. Proceeding with general refinement."
        
        return await super().process(prompt, context)
    
    def _prepare_message(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Prepare the message for the refiner agent with context.
        
        Args:
            prompt: The original prompt to refine
            context: Additional context, including the critic's feedback
            
        Returns:
            The formatted message for the refiner
        """
        message = f"Original prompt: \"{prompt}\"\n\n"
        
        if context:
            if "critic_feedback" in context:
                message += f"Critic's feedback:\n{context['critic_feedback']}\n\n"
            
            # Add any other context
            for key, value in context.items():
                if key not in ["critic_feedback", "prompt"]:
                    message += f"{key}: {value}\n"
        
        message += (
            "\nYour task is to refine the original prompt based on the feedback.\n"
            "First, analyze the feedback and create a plan to address each issue.\n"
            "Then, create an improved version of the prompt.\n\n"
            "Please format your response with:\n"
            "1. A brief analysis of the issues\n"
            "2. The refined prompt, clearly labeled\n"
            "3. Confidence level (0-1) in your refinement"
        )
        
        return message
    
    def _process_response(self, response: str) -> Dict[str, Any]:
        """
        Process the refiner agent's response to extract the refined prompt.
        
        Args:
            response: The raw response from the refiner agent
            
        Returns:
            A structured response with the refined prompt and confidence
        """
        try:
            # Extract the refined prompt
            refined_prompt = self._extract_refined_prompt(response)
            
            # Extract confidence level (default to 0.8 if not found)
            confidence = self._extract_confidence(response)
            
            # Extract improvements made
            improvements = self._extract_improvements(response)
            
            # Create the structured response
            return {
                "content": refined_prompt or response,
                "confidence": confidence,
                "suggestions": improvements,
                "analysis": {
                    "raw_response": response,
                    "improvement_count": len(improvements),
                }
            }
        except Exception as e:
            print(f"Error processing refiner response: {e}")
            # Fallback to basic response
            return {
                "content": response,
                "confidence": 0.8,
                "suggestions": [],
                "analysis": {
                    "raw_response": response,
                },
            }
    
    def _extract_refined_prompt(self, text: str) -> Optional[str]:
        """Extract the refined prompt from the response text."""
        # Look for explicit refined prompt sections
        refined_patterns = [
            r"(?:^|\n)(?:Refined|Improved|Enhanced|Final) [Pp]rompt:?\s*\"?([^\"]+)\"?(?=\n|$)",
            r"(?:^|\n)\"([^\"]+)\"(?=\n|$)",  # Quoted text that might be the prompt
        ]
        
        for pattern in refined_patterns:
            match = re.search(pattern, text, re.MULTILINE | re.DOTALL)
            if match:
                return match.group(1).strip()
        
        # If no explicit sections, look for the last paragraph that looks like a prompt
        paragraphs = re.split(r"\n\s*\n", text)
        for paragraph in reversed(paragraphs):
            # Skip paragraphs that look like analysis or confidence statements
            if re.search(r"(?:confidence|analysis|suggest|improv)", paragraph, re.IGNORECASE):
                continue
            
            # Skip very short paragraphs
            if len(paragraph) < 30:
                continue
                
            # This might be the prompt
            return paragraph.strip()
        
        return None
    
    def _extract_confidence(self, text: str) -> float:
        """Extract the confidence level from the response text."""
        # Look for explicit confidence indicators
        confidence_match = re.search(r"[Cc]onfidence:?\s*(\d+(?:\.\d+)?)", text)
        if confidence_match:
            try:
                return float(confidence_match.group(1))
            except ValueError:
                pass
        
        # Look for qualitative indicators
        if re.search(r"(?:high confidence|very confident|certain)", text, re.IGNORECASE):
            return 0.9
        elif re.search(r"(?:moderate confidence|somewhat confident)", text, re.IGNORECASE):
            return 0.7
        elif re.search(r"(?:low confidence|not confident|uncertain)", text, re.IGNORECASE):
            return 0.5
            
        # Default confidence
        return 0.8
    
    def _extract_improvements(self, text: str) -> List[str]:
        """Extract a list of improvements from the response text."""
        improvements = []
        
        # Look for sections describing improvements
        improvement_section = re.search(
            r"(?:^|\n)(?:Changes|Improvements|Enhancements) made:?\s*\n((?:.+\n)+)", 
            text, 
            re.IGNORECASE
        )
        
        if improvement_section:
            section_text = improvement_section.group(1)
            # Extract individual improvements
            items = re.findall(r"(?:^|\n)\s*[-*•\d.]\s*(.+?)(?=\n\s*[-*•\d.]|\n\s*\n|$)", section_text, re.MULTILINE)
            if items:
                improvements.extend([item.strip() for item in items if item.strip()])
        
        # If no structured improvements found, look for sentences about improvements
        if not improvements:
            improve_sentences = re.findall(
                r"(?:^|\n)([^.\n]+(?:improve|enhance|add|change|clarify|specify)[^.\n]+\.)", 
                text
            )
            improvements.extend([sentence.strip() for sentence in improve_sentences if sentence.strip()])
        
        return improvements 