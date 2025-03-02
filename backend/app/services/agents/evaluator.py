from typing import Dict, Any, List, Optional
import re
from .base import BaseAgent

class EvaluatorAgent(BaseAgent):
    """
    Evaluator agent responsible for validating refined prompts.
    This agent verifies the quality of the refined prompt and provides a final assessment.
    """
    
    def __init__(self, role: str):
        """
        Initialize the Evaluator agent.
        
        Args:
            role: The role context (webdev, syseng, analyst, designer)
        """
        super().__init__("evaluator", role)
    
    async def process(
        self, 
        prompt: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process the refined prompt and return an evaluation.
        
        Args:
            prompt: The refined prompt to evaluate
            context: Additional context including original prompt and critic feedback
            
        Returns:
            A dictionary with the evaluation results
        """
        if not context:
            context = {}
        
        # Ensure we have necessary context
        if "original_prompt" not in context:
            context["original_prompt"] = "Not provided"
            
        if "critic_feedback" not in context:
            context["critic_feedback"] = "Not provided"
        
        return await super().process(prompt, context)
    
    def _prepare_message(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Prepare the message for the evaluator agent with context.
        
        Args:
            prompt: The refined prompt to evaluate
            context: Additional context including original prompt and critic feedback
            
        Returns:
            The formatted message for the evaluator
        """
        message = (
            f"You need to evaluate the quality of a refined prompt.\n\n"
            f"Original prompt: \"{context.get('original_prompt', 'Not provided')}\"\n\n"
            f"Refined prompt: \"{prompt}\"\n\n"
        )
        
        if "critic_feedback" in context:
            message += f"Critic's feedback:\n{context['critic_feedback']}\n\n"
        
        # Add any other context
        for key, value in context.items():
            if key not in ["critic_feedback", "original_prompt"]:
                message += f"{key}: {value}\n"
        
        message += (
            "\nYour task is to evaluate the refined prompt and provide a final assessment.\n"
            "Please consider:\n"
            "1. Does the refined prompt address all the critic's concerns?\n"
            "2. Is the refined prompt technically accurate and complete?\n"
            "3. Is the refined prompt clear, specific, and well-structured?\n"
            "4. Is the refined prompt appropriate for the given role?\n\n"
            "Please format your response with:\n"
            "1. Overall assessment\n"
            "2. Strengths of the refined prompt\n"
            "3. Any remaining weaknesses or suggestions\n"
            "4. Quality score (0-1) for the refined prompt"
        )
        
        return message
    
    def _process_response(self, response: str) -> Dict[str, Any]:
        """
        Process the evaluator agent's response to extract the evaluation results.
        
        Args:
            response: The raw response from the evaluator agent
            
        Returns:
            A structured response with the evaluation results
        """
        try:
            # Extract quality score
            quality_score = self._extract_quality_score(response)
            
            # Extract strengths and weaknesses
            strengths = self._extract_strengths(response)
            weaknesses = self._extract_weaknesses(response)
            
            # Extract the overall assessment
            assessment = self._extract_assessment(response)
            
            # Create the structured response
            return {
                "content": assessment or response,
                "confidence": quality_score,
                "suggestions": weaknesses,
                "analysis": {
                    "quality_score": quality_score,
                    "strengths": strengths,
                    "weaknesses": weaknesses,
                    "assessment": assessment,
                }
            }
        except Exception as e:
            print(f"Error processing evaluator response: {e}")
            # Fallback to basic response
            return {
                "content": response,
                "confidence": 0.7,
                "suggestions": [],
                "analysis": {},
            }
    
    def _extract_quality_score(self, text: str) -> float:
        """Extract the quality score from the response text."""
        # Look for explicit quality score indicators
        score_patterns = [
            r"[Qq]uality [Ss]core:?\s*(\d+(?:\.\d+)?)",
            r"[Ss]core:?\s*(\d+(?:\.\d+)?)",
            r"[Rr]ating:?\s*(\d+(?:\.\d+)?)\s*\/\s*1",
        ]
        
        for pattern in score_patterns:
            score_match = re.search(pattern, text)
            if score_match:
                try:
                    return float(score_match.group(1))
                except ValueError:
                    pass
        
        # Look for percentage scores
        percentage_match = re.search(r"(\d+(?:\.\d+)?)\s*%", text)
        if percentage_match:
            try:
                return float(percentage_match.group(1)) / 100.0
            except ValueError:
                pass
        
        # Analyze qualitative assessment
        if re.search(r"(?:excellent|outstanding|exceptional)", text, re.IGNORECASE):
            return 0.9
        elif re.search(r"(?:good|strong|solid)", text, re.IGNORECASE):
            return 0.8
        elif re.search(r"(?:adequate|satisfactory|acceptable)", text, re.IGNORECASE):
            return 0.7
        elif re.search(r"(?:moderate|fair|average)", text, re.IGNORECASE):
            return 0.6
        elif re.search(r"(?:weak|poor|inadequate)", text, re.IGNORECASE):
            return 0.4
        
        # Default quality score
        return 0.7
    
    def _extract_strengths(self, text: str) -> List[str]:
        """Extract a list of strengths from the response text."""
        strengths = []
        
        # Look for strengths section
        strengths_section = re.search(
            r"(?:^|\n)(?:Strengths|Positive aspects|Pros|What works well):?\s*\n((?:.+\n)+)",
            text,
            re.IGNORECASE | re.MULTILINE
        )
        
        if strengths_section:
            section_text = strengths_section.group(1)
            # Extract individual strengths
            items = re.findall(r"(?:^|\n)\s*[-*•\d.]\s*(.+?)(?=\n\s*[-*•\d.]|\n\s*\n|$)", section_text, re.MULTILINE)
            if items:
                strengths.extend([item.strip() for item in items if item.strip()])
        
        # If no structured strengths found, look for sentences about strengths
        if not strengths:
            strength_sentences = re.findall(
                r"(?:^|\n)([^.\n]+(?:strength|positive|good|excellent|well done)[^.\n]+\.)",
                text
            )
            strengths.extend([sentence.strip() for sentence in strength_sentences if sentence.strip()])
        
        return strengths
    
    def _extract_weaknesses(self, text: str) -> List[str]:
        """Extract a list of weaknesses from the response text."""
        weaknesses = []
        
        # Look for weaknesses section
        weaknesses_section = re.search(
            r"(?:^|\n)(?:Weaknesses|Negative aspects|Cons|Areas for improvement|Suggestions):?\s*\n((?:.+\n)+)",
            text,
            re.IGNORECASE | re.MULTILINE
        )
        
        if weaknesses_section:
            section_text = weaknesses_section.group(1)
            # Extract individual weaknesses
            items = re.findall(r"(?:^|\n)\s*[-*•\d.]\s*(.+?)(?=\n\s*[-*•\d.]|\n\s*\n|$)", section_text, re.MULTILINE)
            if items:
                weaknesses.extend([item.strip() for item in items if item.strip()])
        
        # If no structured weaknesses found, look for sentences about weaknesses
        if not weaknesses:
            weakness_sentences = re.findall(
                r"(?:^|\n)([^.\n]+(?:weakness|negative|issue|problem|improve|suggest)[^.\n]+\.)",
                text
            )
            weaknesses.extend([sentence.strip() for sentence in weakness_sentences if sentence.strip()])
        
        return weaknesses
    
    def _extract_assessment(self, text: str) -> Optional[str]:
        """Extract the overall assessment from the response text."""
        # Look for assessment section
        assessment_section = re.search(
            r"(?:^|\n)(?:Overall [Aa]ssessment|[Aa]ssessment|[Ee]valuation|[Ss]ummary):?\s*\n((?:.+\n)+?)(?=\n\s*\n|$)",
            text,
            re.IGNORECASE | re.MULTILINE
        )
        
        if assessment_section:
            return assessment_section.group(1).strip()
        
        # If no structured assessment found, use the first paragraph
        paragraphs = re.split(r"\n\s*\n", text)
        if paragraphs:
            return paragraphs[0].strip()
        
        return None 