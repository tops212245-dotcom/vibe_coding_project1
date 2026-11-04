from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole, UserStatus, VerificationStatus


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER


class ProviderRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None
    business_name: str = Field(..., min_length=2, max_length=255)
    business_reg_no: Optional[str] = None
    tax_id: Optional[str] = None
    experience_years: int = Field(default=0, ge=0)
    bio: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: UserRole
    status: UserStatus
    is_verified: bool
    profile_image_url: Optional[str] = None
    provider_id: Optional[int] = None
    technician_id: Optional[int] = None
    customer_id: Optional[int] = None
    business_name: Optional[str] = None
    verification_status: Optional[VerificationStatus] = None

    class Config:
        from_attributes = True


TokenResponse.update_forward_refs()

