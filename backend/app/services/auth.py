"""
Authentication service for handling user authentication and authorization.
"""
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from ..core.config import settings
from .supabase_client import supabase_service

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class AuthService:
    """Service for handling user authentication and authorization."""
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Generate a hash for a password."""
        return pwd_context.hash(password)
    
    async def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate a user by email and password.
        
        Args:
            email: User's email
            password: User's password
            
        Returns:
            User data if authentication successful, None otherwise
        """
        if not supabase_service.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service not available"
            )
            
        try:
            # In a real implementation, you'd use Supabase auth
            # For now, query the users table directly
            response = supabase_service.client.table('users').select('*').eq('email', email).execute()
            
            if not response.data or len(response.data) == 0:
                return None
                
            user = response.data[0]
            
            if not self.verify_password(password, user.get("password_hash", "")):
                return None
                
            # Remove sensitive data before returning
            if "password_hash" in user:
                del user["password_hash"]
                
            return user
            
        except Exception as e:
            print(f"Error authenticating user: {e}")
            return None
    
    def create_access_token(self, data: Dict[str, Any]) -> str:
        """
        Create a JWT access token.
        
        Args:
            data: Data to encode in the token
            
        Returns:
            The encoded JWT token
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
        to_encode.update({"exp": expire})
        
        return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    async def get_current_user(self, token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
        """
        Get the current user from a JWT token.
        
        Args:
            token: JWT token
            
        Returns:
            User data from the token
            
        Raises:
            HTTPException: If the token is invalid or the user doesn't exist
        """
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET, 
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
                
        except JWTError:
            raise credentials_exception
            
        user = await supabase_service.get_user(user_id)
        if user is None:
            raise credentials_exception
            
        return user

# Create a global auth service instance
auth_service = AuthService() 