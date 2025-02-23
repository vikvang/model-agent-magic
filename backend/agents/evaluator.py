from typing import Dict, Any
import json
from .base import BaseAgent

class EvaluatorAgent(BaseAgent):
    def __init__(self, role: str):
        super().__init__("evaluator", role)
    
    def _prepare_message(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Prepare a structured message for the evaluator agent."""
        critic_analysis = context.get("critic_analysis", {}) if context else {}
        refinement = context.get("refinement", {}) if context else {}
        
        message = f"""As a {self.role} expert, evaluate this refined prompt:

Original Prompt: {prompt}

Critic's Analysis:
{json.dumps(critic_analysis, indent=2)}

Refiner's Improvements:
{json.dumps(refinement, indent=2)}

Provide your evaluation in the following JSON format:
{{
    "evaluation_scores": {{
        "clarity": float,  # 0.0 to 1.0
        "technical_accuracy": float,  # 0.0 to 1.0
        "role_alignment": float,  # 0.0 to 1.0
        "improvement_impact": float  # 0.0 to 1.0
    }},
    "validation_checks": [
        {{
            "aspect": str,
            "passed": bool,
            "comment": str
        }}
    ],
    "final_verdict": {{
        "approved": bool,
        "reasoning": str,
        "suggestions_if_not_approved": [str]
    }},
    "final_prompt": str  # The prompt with any final minor adjustments
}}

Focus on:
1. Validating that all critic's concerns are addressed
2. Ensuring technical accuracy for {self.role}
3. Verifying alignment with best practices
4. Making final minor adjustments if necessary"""

        return message
    
    def _process_response(self, response: str) -> Dict[str, Any]:
        """Process the evaluator's response into a structured format."""
        try:
            # Try to parse the response as JSON
            evaluation = json.loads(response)
            
            # Calculate overall confidence
            scores = evaluation.get("evaluation_scores", {})
            confidence = (
                scores.get("clarity", 0) +
                scores.get("technical_accuracy", 0) +
                scores.get("role_alignment", 0) +
                scores.get("improvement_impact", 0)
            ) / 4
            
            # Extract suggestions
            suggestions = []
            
            # Add failed validation checks
            for check in evaluation.get("validation_checks", []):
                if not check.get("passed", True):
                    suggestions.append(f"Issue with {check['aspect']}: {check['comment']}")
            
            # Add suggestions if not approved
            if not evaluation.get("final_verdict", {}).get("approved", False):
                suggestions.extend(
                    evaluation.get("final_verdict", {}).get("suggestions_if_not_approved", [])
                )
            
            return {
                "content": evaluation["final_prompt"],
                "confidence": confidence,
                "suggestions": suggestions,
                "evaluation": evaluation,  # Include full evaluation for reference
            }
            
        except json.JSONDecodeError:
            # Fallback if response is not valid JSON
            return {
                "content": response,
                "confidence": 0.5,
                "suggestions": ["Could not parse detailed evaluation"],
            }
