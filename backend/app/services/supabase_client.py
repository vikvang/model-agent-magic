"""
Supabase client service for database and authentication operations.
"""
from typing import Dict, Any, Optional
import os
from supabase import create_client, Client
from ..core.config import settings
#please work
class SupabaseService:
    """Service for interacting with Supabase for database and authentication."""
    
    def __init__(self):
        """Initialize the Supabase client with configuration."""
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_KEY
        self.client = None
        
        if self.url and self.key:
            try:
                self.client = create_client(self.url, self.key)
            except Exception as e:
                print(f"Error initializing Supabase client: {e}")
        else:
            print("Supabase URL or Key not configured")
    
    def is_configured(self) -> bool:
        """Check if Supabase is properly configured."""
        return self.client is not None
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user information by ID.
        
        Args:
            user_id: The user's unique identifier
            
        Returns:
            User data or None if not found
        """
        if not self.is_configured():
            return None
            
        try:
            response = self.client.table('users').select('*').eq('id', user_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error fetching user: {e}")
            return None
    
    async def save_prompt_history(
        self, 
        user_id: str, 
        original_prompt: str, 
        enhanced_prompt: str,
        role: str,
        success: bool = True,
    ) -> Dict[str, Any]:
        """
        Save prompt history to the database.
        
        Args:
            user_id: The user's unique identifier
            original_prompt: The original prompt text
            enhanced_prompt: The enhanced prompt text
            role: The role used for enhancement
            success: Whether the enhancement was successful
            
        Returns:
            The saved record or error info
        """
        if not self.is_configured():
            return {"success": False, "error": "Supabase not configured"}
            
        try:
            data = {
                "user_id": user_id,
                "original_prompt": original_prompt,
                "enhanced_prompt": enhanced_prompt,
                "role": role,
                "success": success,
                "created_at": "now()",
            }
            
            response = self.client.table('prompt_history').insert(data).execute()
            
            return {
                "success": True,
                "data": response.data[0] if response.data else None
            }
        except Exception as e:
            print(f"Error saving prompt history: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_user_prompt_history(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """
        Get prompt history for a user.
        
        Args:
            user_id: The user's unique identifier
            limit: Maximum number of records to return
            
        Returns:
            List of prompt history records
        """
        if not self.is_configured():
            return {"success": False, "error": "Supabase not configured"}
            
        try:
            response = self.client.table('prompt_history') \
                .select('*') \
                .eq('user_id', user_id) \
                .order('created_at', desc=True) \
                .limit(limit) \
                .execute()
            
            return {
                "success": True,
                "data": response.data if response.data else []
            }
        except Exception as e:
            print(f"Error fetching prompt history: {e}")
            return {"success": False, "error": str(e)}

# Create a global supabase service instance
supabase_service = SupabaseService() 