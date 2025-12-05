from typing import List ,Optional
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, timedelta


class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str
    
    @field_validator('password')
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot exceed 72 bytes')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot exceed 72 bytes')
        return v

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

class TokenData(BaseModel):
    email: Optional[str] = None