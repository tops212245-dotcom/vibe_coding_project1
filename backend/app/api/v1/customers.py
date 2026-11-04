from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.permissions import require_customer, get_current_active_user
from app.models.user import User, Customer, Address
from app.models.feedback import Favorite
from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingResponse, BookingAssignmentResponse

router = APIRouter(prefix="/customers", tags=["Customer Management"])


class AddressCreateRequest(BaseModel):
    title: str = Field(default="Home", max_length=100)
    address_line1: str = Field(..., min_length=3, max_length=255)
    address_line2: Optional[str] = None
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., min_length=3, max_length=20)
    country: str = "India"
    is_default: bool = False


class AddressResponse(BaseModel):
    id: int
    title: str
    address_line1: str
    address_line2: Optional[str]
    city: str
    state: str
    postal_code: str
    country: str
    is_default: bool

    class Config:
        from_attributes = True


@router.get("/addresses", response_model=List[AddressResponse])
def get_customer_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """Retrieve all saved addresses for current customer."""
    addresses = db.query(Address).filter(Address.user_id == current_user.id).order_by(Address.is_default.desc()).all()
    return addresses


@router.post("/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
def create_address(
    payload: AddressCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """Add new address to customer address book."""
    if payload.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    addr = Address(
        user_id=current_user.id,
        title=payload.title,
        address_line1=payload.address_line1,
        address_line2=payload.address_line2,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        country=payload.country,
        is_default=payload.is_default
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return addr


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """Delete address with ownership validation."""
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")
    db.delete(addr)
    db.commit()
    return None


@router.get("/bookings", response_model=List[BookingResponse])
def list_customer_bookings(
    status_filter: Optional[BookingStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """List bookings placed by the authenticated customer."""
    customer = current_user.customer_profile
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer profile missing.")

    query = db.query(Booking).options(
        joinedload(Booking.provider),
        joinedload(Booking.service).joinedload(Booking.service.property.mapper.class_.subcategory),
        joinedload(Booking.address),
        joinedload(Booking.assignment).joinedload(BookingAssignmentResponse.technician.property.mapper.class_.user) if False else joinedload(Booking.assignment),
        joinedload(Booking.payment)
    ).filter(Booking.customer_id == customer.id)

    if status_filter:
        query = query.filter(Booking.status == status_filter)

    bookings = query.order_by(Booking.booking_date.desc(), Booking.booking_time.desc()).all()
    
    result = []
    for b in bookings:
        assignment_resp = None
        if b.assignment:
            tech = b.assignment.technician
            assignment_resp = BookingAssignmentResponse(
                id=b.assignment.id,
                technician_id=tech.id,
                technician_name=f"{tech.user.first_name} {tech.user.last_name}",
                technician_phone=tech.user.phone,
                status=b.assignment.status,
                assigned_at=b.assignment.assigned_at,
                arrived_at=b.assignment.arrived_at,
                completed_at=b.assignment.completed_at,
                completion_notes=b.assignment.completion_notes,
            )

        addr_str = f"{b.address.address_line1}, {b.address.city} - {b.address.postal_code}"
        result.append(BookingResponse(
            id=b.id,
            booking_reference=b.booking_reference,
            customer_id=b.customer_id,
            customer_name=f"{current_user.first_name} {current_user.last_name}",
            customer_phone=current_user.phone,
            provider_id=b.provider_id,
            provider_business_name=b.provider.business_name,
            service_id=b.service_id,
            service_name=b.service.name,
            category_name=b.service.subcategory.category.name if b.service.subcategory and b.service.subcategory.category else "General",
            booking_date=b.booking_date,
            booking_time=b.booking_time,
            estimated_duration_min=b.estimated_duration_min,
            status=b.status,
            problem_description=b.problem_description,
            subtotal=b.subtotal,
            discount=b.discount,
            tax=b.tax,
            total_amount=b.total_amount,
            address_display=addr_str,
            payment_status=b.payment.status.value if b.payment else "PENDING",
            created_at=b.created_at,
            updated_at=b.updated_at,
            assignment=assignment_resp,
        ))
    return result


@router.post("/favorites/{provider_id}")
def toggle_favorite(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """Bookmark or unbookmark a service provider."""
    cust = current_user.customer_profile
    existing = db.query(Favorite).filter(
        Favorite.customer_id == cust.id,
        Favorite.provider_id == provider_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"is_favorite": False, "message": "Removed from favorites"}
    else:
        db.add(Favorite(customer_id=cust.id, provider_id=provider_id))
        db.commit()
        return {"is_favorite": True, "message": "Added to favorites"}

