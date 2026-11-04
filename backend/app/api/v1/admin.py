from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.permissions import require_admin
from app.models.user import User, ServiceProvider, UserRole, UserStatus, VerificationStatus
from app.models.finance import Coupon, DiscountType
from app.models.feedback import AuditLog, Notification
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/admin", tags=["Super Admin Governance"])


class UserStatusUpdateRequest(BaseModel):
    status: UserStatus


class ProviderVerificationRequest(BaseModel):
    verification_status: VerificationStatus
    remarks: Optional[str] = None


class CommissionUpdateRequest(BaseModel):
    commission_rate: Decimal = Field(..., ge=0, le=100)


class CouponCreateRequest(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    discount_type: DiscountType
    discount_value: Decimal = Field(..., gt=0)
    min_order_amount: Decimal = Field(default=0, ge=0)
    max_discount_amount: Optional[Decimal] = None
    valid_from: datetime
    valid_until: datetime
    usage_limit: int = 100


@router.get("/users")
def list_users(
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Admin searches and filters all registered users."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (User.email.ilike(s)) | (User.first_name.ilike(s)) | (User.last_name.ilike(s))
        )
    users = query.order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "name": f"{u.first_name} {u.last_name}",
            "role": u.role.value,
            "status": u.status.value,
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.put("/users/{id}/status")
def update_user_status(
    id: int,
    payload: UserStatusUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Suspend or reactivate user account."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot alter own admin status.")

    user.status = payload.status
    db.add(AuditLog(
        user_id=admin.id,
        action="USER_STATUS_CHANGE",
        details={"target_user_id": user.id, "new_status": payload.status.value}
    ))
    db.commit()
    return {"message": f"User status updated to {payload.status.value}"}


@router.get("/providers/pending")
def list_pending_providers(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List service providers awaiting KYC verification approval."""
    providers = db.query(ServiceProvider).options(joinedload(ServiceProvider.user)).filter(
        ServiceProvider.verification_status == VerificationStatus.PENDING
    ).all()
    return [
        {
            "provider_id": p.id,
            "user_id": p.user_id,
            "business_name": p.business_name,
            "owner_name": f"{p.user.first_name} {p.user.last_name}",
            "email": p.user.email,
            "phone": p.user.phone,
            "business_reg_no": p.business_reg_no,
            "tax_id": p.tax_id,
            "id_proof_url": p.id_proof_url,
            "business_proof_url": p.business_proof_url,
            "experience_years": p.experience_years,
            "bio": p.bio,
            "submitted_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in providers
    ]


@router.put("/providers/{id}/verify")
def verify_provider(
    id: int,
    payload: ProviderVerificationRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Approve or reject a provider registration and KYC application."""
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found.")

    provider.verification_status = payload.verification_status
    provider.verification_notes = payload.remarks
    if payload.verification_status == VerificationStatus.APPROVED:
        provider.user.is_verified = True

    # Notify provider
    db.add(Notification(
        user_id=provider.user_id,
        title=f"KYC Verification {payload.verification_status.value}",
        message=f"Your provider application has been {payload.verification_status.value.lower()}. {payload.remarks or ''}",
        type="KYC",
        entity_type="PROVIDER",
        entity_id=provider.id
    ))

    db.add(AuditLog(
        user_id=admin.id,
        action="PROVIDER_KYC_VERIFICATION",
        details={"provider_id": provider.id, "status": payload.verification_status.value, "remarks": payload.remarks}
    ))

    db.commit()
    return {"message": f"Provider verification status set to {payload.verification_status.value}"}


@router.put("/providers/{id}/commission")
def update_provider_commission(
    id: int,
    payload: CommissionUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Set custom platform commission rate for a provider."""
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found.")

    provider.commission_rate = payload.commission_rate
    db.commit()
    return {"message": f"Commission rate updated to {payload.commission_rate}%"}


@router.get("/coupons")
def list_coupons(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """List promotional coupons."""
    return db.query(Coupon).order_by(Coupon.created_at.desc()).all()


@router.post("/coupons", status_code=status.HTTP_201_CREATED)
def create_coupon(
    payload: CouponCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new promotional discount coupon."""
    existing = db.query(Coupon).filter(Coupon.code == payload.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists.")

    coupon = Coupon(
        code=payload.code.upper(),
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        min_order_amount=payload.min_order_amount,
        max_discount_amount=payload.max_discount_amount,
        valid_from=payload.valid_from,
        valid_until=payload.valid_until,
        usage_limit=payload.usage_limit,
        is_active=True
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Retrieve system security and administrative audit trail."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs

