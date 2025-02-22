from typing import Dict, Any
import json
from .base import BaseAgent

class CriticAgent(BaseAgent):
    def __init__(self, role: str):
        super().__init__("critic", role)
    
    def _prepare_message(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Prepare a structured message for the critic agent."""
        message = f"""Analyze this prompt as a {self.role} expert:

Prompt: {prompt}

Provide your analysis in the following JSON format:
{{
    "clarity_score": float,  # 0.0 to 1.0
    "technical_accuracy_score": float,  # 0.0 to 1.0
    "role_alignment_score": float,  # 0.0 to 1.0
    "issues": [
        {{
            "type": str,  # "clarity", "technical", "role-specific"
            "description": str,
            "suggestion": str
        }}
    ],
    "overall_assessment": str
}}

Focus on:
1. Clarity and specificity
2. Technical accuracy for {self.role}
3. Alignment with {self.role} best practices
4. Areas for improvement"""

        if context:
            message += "\n\nAdditional Context:"
            for key, value in context.items():
                message += f"\n{key}: {value}"
        
        return message
    
    def _process_response(self, response: str) -> Dict[str, Any]:
        """Process the critic's response into a structured format."""
        try:
            # Try to parse the response as JSON
            analysis = json.loads(response)
            
            # Calculate overall confidence
            confidence = (
                analysis.get("clarity_score", 0) +
                analysis.get("technical_accuracy_score", 0) +
                analysis.get("role_alignment_score", 0)
            ) / 3
            
            # Extract suggestions from issues
            suggestions = [
                issue["suggestion"]
                for issue in analysis.get("issues", [])
            ]
            
            return {
                "content": analysis["overall_assessment"],
                "confidence": confidence,
                "suggestions": suggestions,
                "analysis": analysis,  # Include full analysis for the refiner
            }
            
        except json.JSONDecodeError:
            # Fallback if response is not valid JSON
            return {
                "content": response,
                "confidence": 0.5,
                "suggestions": ["Could not parse detailed analysis"],
            }
