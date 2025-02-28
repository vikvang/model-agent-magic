from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class Token(BaseModel):
    """
    Token response model for authentication.
    """
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(..., description="Token type (bearer)")

class TokenData(BaseModel):
    """
    Token data model for decoded JWT tokens.
    """
    user_id: Optional[str] = None

class UserBase(BaseModel):
    """
    Base user model with common fields.
    """
    email: EmailStr = Field(..., description="User email")
    name: Optional[str] = Field(None, description="User full name")

class UserCreate(UserBase):
    """
    User creation model with password.
    """
    password: str = Field(..., min_length=8, description="User password (min 8 characters)")

class UserResponse(UserBase):
    """
    User response model for API responses.
    """
    id: str = Field(..., description="User ID")

class UserInDB(UserBase):
    """
    User database model with hashed password.
    """
    id: str = Field(..., description="User ID")
    password_hash: str = Field(..., description="Hashed password")
    created_at: Optional[str] = Field(None, description="User creation timestamp") 