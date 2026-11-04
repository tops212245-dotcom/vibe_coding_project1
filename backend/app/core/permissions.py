from typing import List, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole, UserStatus

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    auto_error=False
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validate bearer token and retrieve the user from database."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure user account is not suspended or inactive."""
    if current_user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact platform support."
        )
    if current_user.status == UserStatus.INACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive."
        )
    return current_user


def require_role(allowed_roles: List[UserRole]) -> Callable:
    """Dependency factory checking that active user holds one of the required roles."""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: requires one of the following roles: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker


# Role convenience dependencies
require_admin = require_role([UserRole.ADMIN])
require_customer = require_role([UserRole.CUSTOMER])
require_provider = require_role([UserRole.PROVIDER])
require_technician = require_role([UserRole.TECHNICIAN])
require_provider_or_admin = require_role([UserRole.PROVIDER, UserRole.ADMIN])
require_authenticated = get_current_active_user

