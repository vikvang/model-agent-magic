from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict, Any

from ..models.auth_models import (
    Token,
    UserCreate,
    UserResponse,
    UserBase
)
from ..services.auth import auth_service
from ..services.supabase_client import supabase_service

router = APIRouter(tags=["auth"])

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint to get an access token."""
    user = await auth_service.authenticate_user(form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth_service.create_access_token(
        data={"sub": str(user.get("id"))}
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer"
    )

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """Register a new user."""
    if not supabase_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Registration service not available"
        )
    
    # Check if user already exists
    try:
        response = supabase_service.client.table('users').select('id').eq('email', user_data.email).execute()
        if response.data and len(response.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking user existence: {str(e)}"
        )
    
    # Hash the password
    password_hash = auth_service.get_password_hash(user_data.password)
    
    # Create user in database
    try:
        user_dict = user_data.dict(exclude={"password"})
        user_dict["password_hash"] = password_hash
        
        response = supabase_service.client.table('users').insert(user_dict).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
            
        new_user = response.data[0]
        return UserResponse(
            id=new_user.get("id"),
            email=new_user.get("email"),
            name=new_user.get("name")
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(auth_service.get_current_user)):
    """Get information about the currently authenticated user."""
    return UserResponse(
        id=current_user.get("id"),
        email=current_user.get("email"),
        name=current_user.get("name")
    ) 