from typing import Dict, Any, List
import re
from .base import BaseAgent

class CriticAgent(BaseAgent):
    """
    Critic agent responsible for analyzing prompts and identifying issues.
    This agent evaluates the initial prompt and provides feedback for improvements.
    """
    
    def __init__(self, role: str):
        """
        Initialize the Critic agent.
        
        Args:
            role: The role context (webdev, syseng, analyst, designer)
        """
        super().__init__("critic", role)
    
    def _process_response(self, response: str) -> Dict[str, Any]:
        """
        Process the critic agent's response to extract structured feedback.
        
        Args:
            response: The raw response from the critic agent
            
        Returns:
            A structured response with issues, analysis, and confidence
        """
        try:
            # Extract issues and recommendations
            issues = self._extract_issues(response)
            
            # Extract confidence level (default to 0.7 if not found)
            confidence = self._extract_confidence(response)
            
            # Create the structured response
            return {
                "content": response,
                "confidence": confidence,
                "issues": issues,
                "analysis": {
                    "issue_count": len(issues),
                    "primary_concerns": self._extract_primary_concerns(response),
                    "technical_accuracy": self._extract_rating(response, "technical accuracy"),
                    "clarity": self._extract_rating(response, "clarity"),
                    "completeness": self._extract_rating(response, "completeness"),
                }
            }
        except Exception as e:
            print(f"Error processing critic response: {e}")
            # Fallback to basic response
            return {
                "content": response,
                "confidence": 0.7,
                "issues": [],
                "analysis": {},
            }
    
    def _extract_issues(self, text: str) -> List[str]:
        """Extract a list of issues from the response text."""
        issues = []
        
        # Look for numbered lists, bullet points, or "Issues:" sections
        patterns = [
            r"(?:^|\n)\s*\d+\.\s*(.+?)(?=\n\s*\d+\.|\n\s*\n|$)",  # Numbered list
            r"(?:^|\n)\s*[-*•]\s*(.+?)(?=\n\s*[-*•]|\n\s*\n|$)",  # Bullet points
            r"(?:^|\n)Issues:\s*\n\s*(.+?)(?=\n\s*\n|$)",         # Issues section
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.MULTILINE)
            if matches:
                issues.extend([match.strip() for match in matches if match.strip()])
        
        # If no structured issues found, extract sentences that mention issues/problems
        if not issues:
            issue_sentences = re.findall(r"(?:^|\n)([^.\n]+(?:issue|problem|lacks|missing|unclear)[^.\n]+\.)", text)
            issues.extend([sentence.strip() for sentence in issue_sentences if sentence.strip()])
        
        return issues
    
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
        return 0.7
    
    def _extract_primary_concerns(self, text: str) -> List[str]:
        """Extract the primary concerns from the response text."""
        # Look for explicit primary concerns
        primary_concerns_section = re.search(r"(?:^|\n)(?:Primary|Main|Key) [Cc]oncerns?:?\s*\n(.+?)(?=\n\s*\n|$)", text, re.DOTALL)
        if primary_concerns_section:
            concerns_text = primary_concerns_section.group(1).strip()
            # Extract individual concerns
            concerns = re.findall(r"(?:^|\n)\s*[-*•\d.]\s*(.+?)(?=\n\s*[-*•\d.]|\n\s*\n|$)", concerns_text, re.MULTILINE)
            if concerns:
                return [concern.strip() for concern in concerns if concern.strip()]
        
        # Fallback: use the first 1-2 issues as primary concerns
        issues = self._extract_issues(text)
        return issues[:min(2, len(issues))]
    
    def _extract_rating(self, text: str, aspect: str) -> float:
        """Extract a numeric rating for a specific aspect."""
        # Look for ratings in the format "Aspect: X/Y" or "Aspect: X out of Y"
        rating_match = re.search(
            rf"{aspect}:?\s*(\d+(?:\.\d+)?)\s*(?:\/|out of)\s*(\d+(?:\.\d+)?)",
            text,
            re.IGNORECASE
        )
        
        if rating_match:
            try:
                numerator = float(rating_match.group(1))
                denominator = float(rating_match.group(2))
                if denominator > 0:
                    return numerator / denominator
            except (ValueError, ZeroDivisionError):
                pass
        
        # Look for percentage ratings
        percentage_match = re.search(
            rf"{aspect}:?\s*(\d+(?:\.\d+)?)\s*%",
            text,
            re.IGNORECASE
        )
        
        if percentage_match:
            try:
                return float(percentage_match.group(1)) / 100.0
            except ValueError:
                pass
        
        # Default ratings based on positive/negative language for this aspect
        text_lower = text.lower()
        aspect_lower = aspect.lower()
        
        if re.search(rf"{aspect_lower}.*(?:excellent|great|very good|strong)", text_lower):
            return 0.9
        elif re.search(rf"{aspect_lower}.*(?:good|solid)", text_lower):
            return 0.8
        elif re.search(rf"{aspect_lower}.*(?:adequate|acceptable|fair)", text_lower):
            return 0.6
        elif re.search(rf"{aspect_lower}.*(?:poor|weak|inadequate|low)", text_lower):
            return 0.4
        elif re.search(rf"{aspect_lower}.*(?:very poor|very weak|terrible)", text_lower):
            return 0.2
        
        # Default to a neutral rating
        return 0.5 