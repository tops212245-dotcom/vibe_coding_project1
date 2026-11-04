from typing import List, Optional
from datetime import time, datetime, timezone
from decimal import Decimal
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.permissions import require_provider, get_current_active_user
from app.models.user import User, ServiceProvider, Technician, UserRole, UserStatus, VerificationStatus
from app.models.catalog import ProviderService, Service, ServiceArea
from app.models.booking import ProviderWorkingHour, Booking, BookingStatus
from app.models.finance import ProviderEarning, ProviderPayout
from app.schemas.catalog import ProviderServiceResponse, ProviderServiceUpsertRequest
from app.schemas.feedback import ProviderAnalyticsResponse

router = APIRouter(prefix="/providers", tags=["Service Provider Management"])


class KYCSubmissionRequest(BaseModel):
    business_reg_no: Optional[str] = None
    tax_id: Optional[str] = None
    id_proof_url: str = Field(..., min_length=5)
    business_proof_url: Optional[str] = None
    bio: Optional[str] = None


class WorkingHourItem(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: str  # "09:00"
    end_time: str    # "18:00"
    is_closed: bool = False


class TechnicianCreateRequest(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=5)
    phone: str = Field(..., min_length=8)
    password: str = Field(..., min_length=6)
    specialization: Optional[str] = None


class TechnicianResponse(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    phone: Optional[str]
    specialization: Optional[str]
    is_available: bool
    rating: Decimal
    total_jobs: int

    class Config:
        from_attributes = True


@router.get("/me/dashboard", response_model=ProviderAnalyticsResponse)
def get_provider_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider)
):
    """Aggregate provider KPI metrics from real database records."""
    provider = current_user.provider_profile
    if not provider:
        raise HTTPException(status_code=404, detail="Provider record missing.")

    total_bookings = db.query(Booking).filter(Booking.provider_id == provider.id).count()
    
    today_date = datetime.now(timezone.utc).date()
    today_bookings = db.query(Booking).filter(
        Booking.provider_id == provider.id,
        Booking.booking_date == today_date
    ).count()

    pending_requests = db.query(Booking).filter(
        Booking.provider_id == provider.id,
        Booking.status == BookingStatus.PENDING
    ).count()

    confirmed_bookings = db.query(Booking).filter(
        Booking.provider_id == provider.id,
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PROVIDER_ASSIGNED, BookingStatus.IN_PROGRESS])
    ).count()

    completed_services = db.query(Booking).filter(
        Booking.provider_id == provider.id,
        Booking.status == BookingStatus.COMPLETED
    ).count()

    cancelled_bookings = db.query(Booking).filter(
        Booking.provider_id == provider.id,
        Booking.status.in_([BookingStatus.CANCELLED, BookingStatus.REJECTED])
    ).count()

    # Sum earnings
    earnings_rows = db.query(ProviderEarning).filter(ProviderEarning.provider_id == provider.id).all()
    total_earnings = sum((e.net_earning for e in earnings_rows), Decimal("0.00"))
    platform_commissions = sum((e.platform_commission for e in earnings_rows), Decimal("0.00"))

    total_techs = db.query(Technician).filter(Technician.provider_id == provider.id).count()

    return ProviderAnalyticsResponse(
        total_bookings=total_bookings,
        today_bookings=today_bookings,
        pending_requests=pending_requests,
        confirmed_bookings=confirmed_bookings,
        completed_services=completed_services,
        cancelled_bookings=cancelled_bookings,
        total_earnings=total_earnings,
        platform_commissions=platform_commissions,
        average_rating=provider.average_rating or Decimal("0.00"),
        total_technicians=total_techs,
    )


@router.post("/me/kyc")
def submit_kyc_documents(
    payload: KYCSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider)
):
    """Submit business & identity verification proofs for Admin review."""
    provider = current_user.provider_profile
    provider.business_reg_no = payload.business_reg_no
    provider.tax_id = payload.tax_id
    provider.id_proof_url = payload.id_proof_url
    provider.business_proof_url = payload.business_proof_url
    if payload.bio:
        provider.bio = payload.bio
    provider.verification_status = VerificationStatus.PENDING
    db.commit()
    return {"message": "KYC documents submitted successfully. Verification status is PENDING."}


@router.get("/me/services", response_model=List[ProviderServiceResponse])
def get_provider_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider)
):
    """List service catalog offerings configured by provider."""
    provider = current_user.provider_profile
    ps_list = db.query(ProviderService).options(
        joinedload(ProviderService.service).joinedload(Service.subcategory).joinedload(Service.subcategory.property.mapper.class_.category)
    ).filter(ProviderService.provider_id == provider.id).all()

    result = []
    for ps in ps_list:
        cat_name = ps.service.subcategory.category.name if ps.service.subcategory and ps.service.subcategory.category else "Services"
        result.append(ProviderServiceResponse(
            id=ps.id,
            service_id=ps.service_id,
            service_name=ps.service.name,
            category_name=cat_name,
            custom_price=ps.custom_price,
            duration_min=ps.duration_min,
            is_available=ps.is_available,
            description=ps.description
        ))
    return result


@router.post("/me/services", response_model=ProviderServiceResponse)
def upsert_provider_service(
    payload: ProviderServiceUpsertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider)
):
    """Add or update custom pricing for a master service."""
    provider = current_user.provider_profile
    service = db.query(Service).filter(Service.id == payload.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Master service not found.")

    ps = db.query(ProviderService).filter(
        ProviderService.provider_id == provider.id,
        ProviderService.service_id == payload.service_id
    ).first()

    if ps:
        ps.custom_price = payload.custom_price
        ps.duration_min = payload.duration_min
        ps.is_available = payload.is_available
        ps.description = payload.description
    else:
        ps = ProviderService(
            provider_id=provider.id,
            service_id=payload.service_id,
            custom_price=payload.custom_price,
            duration_min=payload.duration_min,
            is_available=payload.is_available,
            description=payload.description
        )
        db.add(ps)

    db.commit()
    db.refresh(ps)
    cat_name = service.subcategory.category.name if service.subcategory and service.subcategory.category else "Services"
    return ProviderServiceResponse(
        id=ps.id,
        service_id=ps.service_id,
        service_name=service.name,
        category_name=cat_name,
        custom_price=ps.custom_price,
        duration_min=ps.duration_min,
        is_available=ps.is_available,
        description=ps.description
    )


@router.delete("/me/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider)
):
    """Remove a service offering from provider portfolio."""
    provider = current_user.provider_profile
    ps = db.query(ProviderService).filter(
        ProviderService.provider_id == provider.id,
        ProviderService.service_id == service_id
    ).first()
    if not ps:
        raise HTTPException(status_code=404, detail="Service offering not found.")
    db.delete(ps)
    db.commit()
    return None


@router.get("/me/working-hours")
def get_working_hours(db: Session = Depends(get_db), current_user: User = Depends(require_provider)):
    """Fetch weekly operating schedule."""
    provider = current_user.provider_profile
    hours = db.query(ProviderWorkingHour).filter(ProviderWorkingHour.provider_id == provider.id).order_by(ProviderWorkingHour.day_of_week.asc()).all()
    return [
        {
            "day_of_week": h.day_of_week,
            "start_time": h.start_time.strftime("%H:%M"),
            "end_time": h.end_time.strftime("%H:%M"),
            "is_closed": h.is_closed
        }
        for h in hours
    ]


@router.put("/me/working-hours")
def set_working_hours(
    payload: List[WorkingHourItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider)
):
    """Set or update weekly operating schedule."""
    provider = current_user.provider_profile
    db.query(ProviderWorkingHour).filter(ProviderWorkingHour.provider_id == provider.id).delete()
    for item in payload:
        sh, sm = map(int, item.start_time.split(":"))
        eh, em = map(int, item.end_time.split(":"))
        db.add(ProviderWorkingHour(
            provider_id=provider.id,
            day_of_week=item.day_of_week,
            start_time=time(sh, sm),
            end_time=time(eh, em),
            is_closed=item.is_closed
        ))
    db.commit()
    return {"message": "Working hours updated successfully."}


@router.get("/me/technicians", response_model=List[TechnicianResponse])
def get_technicians(db: Session = Depends(get_db), current_user: User = Depends(require_provider)):
    """List all technicians belonging to provider's fleet."""
    provider = current_user.provider_profile
    techs = db.query(Technician).options(joinedload(Technician.user)).filter(Technician.provider_id == provider.id).all()
    return [
        TechnicianResponse(
            id=t.id,
            user_id=t.user_id,
            name=f"{t.user.first_name} {t.user.last_name}",
            email=t.user.email,
            phone=t.user.phone,
            specialization=t.specialization,
            is_available=t.is_available,
            rating=t.rating,
            total_jobs=t.total_jobs,
        )
        for t in techs
    ]


@router.post("/me/technicians", response_model=TechnicianResponse, status_code=status.HTTP_201_CREATED)
def create_technician(
    payload: TechnicianCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider)
):
    """Onboard a new technician under provider's organization."""
    provider = current_user.provider_profile
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        role=UserRole.TECHNICIAN,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        phone=payload.phone.strip(),
        status=UserStatus.ACTIVE,
        is_verified=True
    )
    db.add(user)
    db.flush()

    tech = Technician(
        user_id=user.id,
        provider_id=provider.id,
        specialization=payload.specialization,
        is_available=True,
        rating=Decimal("5.00"),
        total_jobs=0
    )
    db.add(tech)
    db.commit()
    db.refresh(tech)

    return TechnicianResponse(
        id=tech.id,
        user_id=user.id,
        name=f"{user.first_name} {user.last_name}",
        email=user.email,
        phone=user.phone,
        specialization=tech.specialization,
        is_available=tech.is_available,
        rating=tech.rating,
        total_jobs=tech.total_jobs,
    )

