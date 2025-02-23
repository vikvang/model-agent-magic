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
            # First try to parse as JSON
            try:
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
                    "content": analysis.get("overall_assessment", "Analysis completed"),
                    "confidence": confidence,
                    "suggestions": suggestions,
                    "analysis": analysis,
                }
            except json.JSONDecodeError:
                # If not JSON, try to extract structured information from the text
                print("Response is not JSON, processing as text")
                
                # Create a structured analysis even for unstructured text
                analysis = {
                    "clarity_score": 0.5,  # Default scores for unstructured responses
                    "technical_accuracy_score": 0.5,
                    "role_alignment_score": 0.5,
                    "issues": [],
                    "overall_assessment": response
                }
                
                # Try to extract recommendations as issues
                if "Recommendations:" in response:
                    recommendations_section = response.split("Recommendations:")[1].split("\n")
                    for r in recommendations_section:
                        r = r.strip().strip('123456789.')
                        if r and r[0].isdigit():
                            analysis["issues"].append({
                                "type": "clarity",  # Default type
                                "description": r,
                                "suggestion": r
                            })
                
                # Calculate confidence from our default scores
                confidence = (
                    analysis["clarity_score"] +
                    analysis["technical_accuracy_score"] +
                    analysis["role_alignment_score"]
                ) / 3
                
                return {
                    "content": analysis["overall_assessment"],
                    "confidence": confidence,
                    "suggestions": [issue["suggestion"] for issue in analysis["issues"]],
                    "analysis": analysis
                }
                
        except Exception as e:
            print(f"Unexpected error processing response: {str(e)}")
            print(f"Response was: {response}")
            return {
                "content": "An error occurred while analyzing the prompt",
                "confidence": 0.0,
                "suggestions": ["Error during analysis"],
                "analysis": {"error": str(e)}
            }
