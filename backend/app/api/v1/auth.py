from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token,
    decode_token, hash_token
)
from app.core.permissions import get_current_user, get_current_active_user
from app.models.user import (
    User, Customer, ServiceProvider, Technician, RefreshToken, PasswordResetToken,
    UserRole, UserStatus, VerificationStatus
)
from app.schemas.auth import (
    UserRegisterRequest, ProviderRegisterRequest, LoginRequest,
    RefreshTokenRequest, ForgotPasswordRequest, ResetPasswordRequest,
    ChangePasswordRequest, TokenResponse, UserResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def build_user_response(user: User) -> UserResponse:
    provider_id = user.provider_profile.id if user.provider_profile else None
    technician_id = user.technician_profile.id if user.technician_profile else None
    customer_id = user.customer_profile.id if user.customer_profile else None
    business_name = user.provider_profile.business_name if user.provider_profile else None
    verification_status = user.provider_profile.verification_status if user.provider_profile else None

    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        role=user.role,
        status=user.status,
        is_verified=user.is_verified,
        profile_image_url=user.profile_image_url,
        provider_id=provider_id,
        technician_id=technician_id,
        customer_id=customer_id,
        business_name=business_name,
        verification_status=verification_status,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_customer(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Customer self-serve registration."""
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        role=UserRole.CUSTOMER,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        phone=payload.phone,
        status=UserStatus.ACTIVE,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    customer = Customer(user_id=user.id)
    db.add(customer)
    db.commit()
    db.refresh(user)

    # Issue tokens
    access_token = create_access_token(user.id, user.role.value, user.email)
    refresh_token = create_refresh_token(user.id)
    db.add(RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    ))
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=build_user_response(user)
    )


@router.post("/register-provider", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_provider(payload: ProviderRegisterRequest, db: Session = Depends(get_db)):
    """Service Provider registration flow with PENDING verification status."""
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        role=UserRole.PROVIDER,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        phone=payload.phone,
        status=UserStatus.ACTIVE,
        is_verified=False,
    )
    db.add(user)
    db.flush()

    provider = ServiceProvider(
        user_id=user.id,
        business_name=payload.business_name.strip(),
        business_reg_no=payload.business_reg_no,
        tax_id=payload.tax_id,
        experience_years=payload.experience_years,
        bio=payload.bio,
        verification_status=VerificationStatus.PENDING,
    )
    db.add(provider)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id, user.role.value, user.email)
    refresh_token = create_refresh_token(user.id)
    db.add(RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    ))
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=build_user_response(user)
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate any user role (Customer, Provider, Technician, Admin) and return JWT."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been suspended by platform administration."
        )

    access_token = create_access_token(user.id, user.role.value, user.email)
    refresh_token = create_refresh_token(user.id)

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    ))
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=build_user_response(user)
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Rotate JWT refresh token and issue a fresh access token."""
    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    user_id = decoded.get("sub")
    token_hash_val = hash_token(payload.refresh_token)
    db_token = db.query(RefreshToken).filter(
        RefreshToken.user_id == int(user_id),
        RefreshToken.token_hash == token_hash_val,
        RefreshToken.is_revoked == False
    ).first()

    if not db_token or db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is expired or revoked."
        )

    # Invalidate old token (Rotation)
    db_token.is_revoked = True

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or user.status == UserStatus.SUSPENDED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inaccessible.")

    new_access_token = create_access_token(user.id, user.role.value, user.email)
    new_refresh_token = create_refresh_token(user.id)

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=hash_token(new_refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    ))
    db.commit()

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user=build_user_response(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Fetch profile of currently logged-in user."""
    return build_user_response(current_user)


@router.post("/logout")
def logout(payload: RefreshTokenRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Revoke active refresh token on logout."""
    token_hash_val = hash_token(payload.refresh_token)
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.token_hash == token_hash_val
    ).update({"is_revoked": True})
    db.commit()
    return {"message": "Logged out successfully."}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate password reset token."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    # Always return success message to prevent user enumeration
    if user:
        reset_token = create_access_token(user.id, "RESET", user.email, expires_delta=timedelta(hours=1))
        db.add(PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(reset_token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
        ))
        db.commit()
    return {"message": "If this email exists in our system, password reset instructions have been dispatched."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using verified token."""
    decoded = decode_token(payload.token)
    if not decoded:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")

    user_id = decoded.get("sub")
    token_h = hash_token(payload.token)
    db_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == int(user_id),
        PasswordResetToken.token_hash == token_h,
        PasswordResetToken.is_used == False
    ).first()

    if not db_token or db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token is invalid or expired.")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.hashed_password = get_password_hash(payload.new_password)
    db_token.is_used = True
    db.commit()
    return {"message": "Password reset successfully. You may now log in with your new password."}

