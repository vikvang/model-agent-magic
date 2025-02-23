from typing import Dict, Any
import json
from .base import BaseAgent

class RefinerAgent(BaseAgent):
    def __init__(self, role: str):
        super().__init__("refiner", role)
    
    def _prepare_message(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Prepare a structured message for the refiner agent."""
        critic_analysis = context.get("critic_analysis", {}) if context else {}
        
        message = f"""As a {self.role} expert, improve this prompt based on the critic's analysis:

Original Prompt: {prompt}

Critic's Analysis:
{json.dumps(critic_analysis, indent=2)}

Provide your refinements in the following JSON format:
{{
    "refined_prompt": str,
    "improvements": [
        {{
            "original_issue": str,
            "how_addressed": str,
            "impact": str
        }}
    ],
    "technical_enhancements": [
        {{
            "aspect": str,
            "enhancement": str
        }}
    ],
    "confidence_assessment": {{
        "clarity_improvement": float,  # 0.0 to 1.0
        "technical_accuracy_improvement": float,  # 0.0 to 1.0
        "role_alignment_improvement": float  # 0.0 to 1.0
    }}
}}

Focus on:
1. Addressing each issue raised by the critic
2. Enhancing technical accuracy and specificity
3. Improving alignment with {self.role} best practices
4. Maintaining clarity and conciseness"""

        return message
    
    def _process_response(self, response: str) -> Dict[str, Any]:
        """Process the refiner's response into a structured format."""
        try:
            # Try to parse the response as JSON
            refinement = json.loads(response)
            
            # Calculate overall confidence
            confidence_assessment = refinement.get("confidence_assessment", {})
            confidence = (
                confidence_assessment.get("clarity_improvement", 0) +
                confidence_assessment.get("technical_accuracy_improvement", 0) +
                confidence_assessment.get("role_alignment_improvement", 0)
            ) / 3
            
            # Extract suggestions from improvements
            suggestions = [
                f"{imp['original_issue']} → {imp['how_addressed']}"
                for imp in refinement.get("improvements", [])
            ] + [
                f"Enhanced {enh['aspect']}: {enh['enhancement']}"
                for enh in refinement.get("technical_enhancements", [])
            ]
            
            return {
                "content": refinement["refined_prompt"],
                "confidence": confidence,
                "suggestions": suggestions,
                "refinement": refinement,  # Include full refinement for the evaluator
            }
            
        except json.JSONDecodeError:
            # Fallback if response is not valid JSON
            return {
                "content": response,
                "confidence": 0.5,
                "suggestions": ["Could not parse detailed refinements"],
            }
