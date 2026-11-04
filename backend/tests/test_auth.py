import pytest
from fastapi import HTTPException
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.permissions import require_admin, require_provider, require_customer, require_technician
from app.models.user import User, UserRole, UserStatus
from jose import jwt
from app.core.config import settings

def test_password_hashing_and_verification():
    raw = "SecureSecret123!"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_token_generation_and_claims(admin_user):
    token = create_access_token(
        subject=admin_user.id,
        role=admin_user.role.value,
        email=admin_user.email
    )
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded["sub"] == str(admin_user.id)
    assert decoded["role"] == "ADMIN"
    assert "exp" in decoded

def test_rbac_admin_guard_permits_admin(admin_user):
    # Admin must pass admin guard
    authorized = require_admin(admin_user)
    assert authorized.id == admin_user.id
    assert authorized.role == UserRole.ADMIN

def test_rbac_admin_guard_rejects_customer(customer_user):
    # Customer accessing admin route must raise 403 Forbidden
    with pytest.raises(HTTPException) as exc_info:
        require_admin(customer_user)
    assert exc_info.value.status_code == 403

def test_rbac_provider_guard(provider_user, customer_user):
    assert require_provider(provider_user).id == provider_user.id
    with pytest.raises(HTTPException) as exc_info:
        require_provider(customer_user)
    assert exc_info.value.status_code == 403

def test_rbac_technician_guard(technician_user, customer_user):
    assert require_technician(technician_user).id == technician_user.id
    with pytest.raises(HTTPException) as exc_info:
        require_technician(customer_user)
    assert exc_info.value.status_code == 403
