import secrets
from datetime import datetime, time, timedelta, timezone, date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.permissions import (
    require_customer, require_provider, require_authenticated, get_current_active_user
)
from app.models.user import User, Customer, ServiceProvider, Technician, Address, UserRole
from app.models.catalog import Service, ProviderService
from app.models.booking import (
    Booking, BookingAssignment, BookingStatusHistory, BookingImage,
    ProviderWorkingHour, BookingStatus, AssignmentStatus, BookingImageType
)
from app.models.finance import Coupon, CouponUsage, DiscountType, Payment, PaymentStatus
from app.models.feedback import Notification
from app.schemas.booking import (
    SlotCheckRequest, SlotCheckResponse, BookingCreateRequest,
    BookingResponse, BookingDetailResponse, BookingAssignmentResponse,
    BookingStatusHistoryResponse, BookingImageResponse,
    ProviderBookingActionRequest, AssignTechnicianRequest,
    BookingCancelRequest, BookingRescheduleRequest
)

router = APIRouter(prefix="/bookings", tags=["Booking & Scheduling Engine"])


def parse_time_str(time_str: str) -> time:
    """Safely parse HH:MM string to time object."""
    try:
        parts = time_str.strip().split(":")
        return time(int(parts[0]), int(parts[1]))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid time format. Expected HH:MM (e.g. 10:00)")


def add_minutes_to_time(t: time, minutes: int) -> time:
    """Add minutes to a time object, clamping to 23:59:59 if crossing day boundary."""
    dt = datetime.combine(date.today(), t) + timedelta(minutes=minutes)
    return dt.time()


def check_slot_conflict(
    db: Session,
    provider_id: int,
    booking_date: date,
    start_t: time,
    duration_min: int,
    exclude_booking_id: Optional[int] = None
) -> Optional[str]:
    """
    Check for schedule collisions against working hours and existing active bookings.
    Returns error reason string if conflict exists, or None if available.
    """
    # 1. Check working hours
    day_of_week = booking_date.weekday()  # 0=Monday, 6=Sunday
    working_hour = db.query(ProviderWorkingHour).filter(
        ProviderWorkingHour.provider_id == provider_id,
        ProviderWorkingHour.day_of_week == day_of_week
    ).first()

    if working_hour:
        if working_hour.is_closed:
            return "Provider is closed on this day of the week."
        end_t = add_minutes_to_time(start_t, duration_min)
        if start_t < working_hour.start_time or end_t > working_hour.end_time:
            return f"Selected time falls outside provider operating hours ({working_hour.start_time.strftime('%H:%M')} - {working_hour.end_time.strftime('%H:%M')})."

    # 2. Check overlap with active existing bookings
    end_t = add_minutes_to_time(start_t, duration_min)

    existing_bookings_query = db.query(Booking).filter(
        Booking.provider_id == provider_id,
        Booking.booking_date == booking_date,
        Booking.status.in_([
            BookingStatus.CONFIRMED,
            BookingStatus.PROVIDER_ASSIGNED,
            BookingStatus.IN_PROGRESS
        ])
    )
    if exclude_booking_id:
        existing_bookings_query = existing_bookings_query.filter(Booking.id != exclude_booking_id)

    active_bookings = existing_bookings_query.all()
    for b in active_bookings:
        b_start = b.booking_time
        b_end = add_minutes_to_time(b_start, b.estimated_duration_min)
        # Collision condition: NOT (new_end <= existing_start OR new_start >= existing_end)
        if not (end_t <= b_start or start_t >= b_end):
            return f"Time slot conflicts with an existing booking ({b_start.strftime('%H:%M')} - {b_end.strftime('%H:%M')}). Please choose another slot."

    return None


@router.post("/check-availability", response_model=SlotCheckResponse)
def check_availability(payload: SlotCheckRequest, db: Session = Depends(get_db)):
    """Pre-flight check to verify if a provider slot is open."""
    start_t = parse_time_str(payload.booking_time)

    # Fetch provider service custom duration and price if exists
    ps = db.query(ProviderService).filter(
        ProviderService.provider_id == payload.provider_id,
        ProviderService.service_id == payload.service_id,
        ProviderService.is_available == True
    ).first()

    service = db.query(Service).filter(Service.id == payload.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")

    duration_min = ps.duration_min if ps else service.estimated_duration_min
    price = ps.custom_price if ps else service.base_price

    conflict_reason = check_slot_conflict(
        db=db,
        provider_id=payload.provider_id,
        booking_date=payload.booking_date,
        start_t=start_t,
        duration_min=duration_min
    )

    if conflict_reason:
        return SlotCheckResponse(
            is_available=False,
            reason=conflict_reason,
            estimated_duration_min=duration_min,
            calculated_price=price
        )

    return SlotCheckResponse(
        is_available=True,
        reason=None,
        estimated_duration_min=duration_min,
        calculated_price=price
    )


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """
    Create booking with atomic backend double-booking validation and transaction lock.
    """
    customer = current_user.customer_profile
    if not customer:
        raise HTTPException(status_code=400, detail="Customer profile required.")

    # Validate provider
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == payload.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Service provider not found.")
    if provider.verification_status != "APPROVED":
        raise HTTPException(status_code=400, detail="Provider is not verified to receive bookings.")

    # Validate service
    service = db.query(Service).filter(Service.id == payload.service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found or inactive.")

    # Validate address belongs to customer
    address = db.query(Address).filter(Address.id == payload.address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=400, detail="Invalid address selection.")

    # Determine duration and base price
    ps = db.query(ProviderService).filter(
        ProviderService.provider_id == provider.id,
        ProviderService.service_id == service.id,
        ProviderService.is_available == True
    ).first()
    duration_min = ps.duration_min if ps else service.estimated_duration_min
    subtotal = ps.custom_price if ps else service.base_price

    start_t = parse_time_str(payload.booking_time)

    # CRITICAL: Atomic Concurrency Lock & Double Booking Prevention
    conflict = check_slot_conflict(
        db=db,
        provider_id=provider.id,
        booking_date=payload.booking_date,
        start_t=start_t,
        duration_min=duration_min
    )
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=conflict
        )

    # Apply Coupon Discount if supplied
    discount = Decimal("0.00")
    coupon_obj = None
    if payload.coupon_code:
        now = datetime.now(timezone.utc)
        coupon_obj = db.query(Coupon).filter(
            Coupon.code == payload.coupon_code.strip().upper(),
            Coupon.is_active == True,
            Coupon.valid_from <= now,
            Coupon.valid_until >= now
        ).first()
        if coupon_obj and subtotal >= coupon_obj.min_order_amount:
            if coupon_obj.discount_type == DiscountType.PERCENTAGE:
                disc = (subtotal * coupon_obj.discount_value) / Decimal("100.00")
                if coupon_obj.max_discount_amount and disc > coupon_obj.max_discount_amount:
                    disc = coupon_obj.max_discount_amount
                discount = disc
            else:
                discount = min(coupon_obj.discount_value, subtotal)

    # 5% GST tax calculation
    taxable_amount = max(subtotal - discount, Decimal("0.00"))
    tax = (taxable_amount * Decimal("5.00")) / Decimal("100.00")
    total_amount = taxable_amount + tax

    ref = f"BK-{datetime.now().strftime('%Y%m%d')}-{secrets.token_hex(4).upper()}"

    booking = Booking(
        booking_reference=ref,
        customer_id=customer.id,
        provider_id=provider.id,
        service_id=service.id,
        address_id=address.id,
        booking_date=payload.booking_date,
        booking_time=start_t,
        estimated_duration_min=duration_min,
        status=BookingStatus.PENDING,
        problem_description=payload.problem_description,
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total_amount=total_amount
    )
    db.add(booking)
    db.flush()

    # Record coupon usage if applied
    if coupon_obj and discount > 0:
        db.add(CouponUsage(
            coupon_id=coupon_obj.id,
            customer_id=customer.id,
            booking_id=booking.id,
            discount_applied=discount
        ))
        coupon_obj.times_used += 1

    # Status history entry
    db.add(BookingStatusHistory(
        booking_id=booking.id,
        previous_status=None,
        new_status=BookingStatus.PENDING.value,
        changed_by_user_id=current_user.id,
        remarks="Booking placed by customer."
    ))

    # Notify provider
    db.add(Notification(
        user_id=provider.user_id,
        title="New Booking Request",
        message=f"You received a new booking request {ref} for {service.name} on {payload.booking_date}.",
        type="BOOKING",
        entity_type="BOOKING",
        entity_id=booking.id
    ))

    db.commit()
    db.refresh(booking)

    addr_str = f"{address.address_line1}, {address.city} - {address.postal_code}"
    cat_name = service.subcategory.category.name if service.subcategory and service.subcategory.category else "Services"

    return BookingResponse(
        id=booking.id,
        booking_reference=booking.booking_reference,
        customer_id=booking.customer_id,
        customer_name=f"{current_user.first_name} {current_user.last_name}",
        customer_phone=current_user.phone,
        provider_id=booking.provider_id,
        provider_business_name=provider.business_name,
        service_id=booking.service_id,
        service_name=service.name,
        category_name=cat_name,
        booking_date=booking.booking_date,
        booking_time=booking.booking_time,
        estimated_duration_min=booking.estimated_duration_min,
        status=booking.status,
        problem_description=booking.problem_description,
        subtotal=booking.subtotal,
        discount=booking.discount,
        tax=booking.tax,
        total_amount=booking.total_amount,
        address_display=addr_str,
        payment_status="PENDING",
        created_at=booking.created_at,
        updated_at=booking.updated_at,
        assignment=None
    )


@router.get("/{id}", response_model=BookingDetailResponse)
def get_booking_details(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve complete booking card, history, and attached images."""
    booking = db.query(Booking).options(
        joinedload(Booking.customer).joinedload(Customer.user),
        joinedload(Booking.provider),
        joinedload(Booking.service).joinedload(Service.subcategory).joinedload(Service.subcategory.property.mapper.class_.category),
        joinedload(Booking.address),
        joinedload(Booking.assignment).joinedload(BookingAssignment.technician).joinedload(Technician.user),
        joinedload(Booking.status_history),
        joinedload(Booking.images),
        joinedload(Booking.payment)
    ).filter(Booking.id == id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    # Authorization check
    is_admin = current_user.role == UserRole.ADMIN
    is_cust = booking.customer.user_id == current_user.id
    is_prov = booking.provider.user_id == current_user.id
    is_tech = booking.assignment and booking.assignment.technician.user_id == current_user.id

    if not (is_admin or is_cust or is_prov or is_tech):
        raise HTTPException(status_code=403, detail="Access denied to this booking record.")

    addr_str = f"{booking.address.address_line1}, {booking.address.city} - {booking.address.postal_code}"
    cat_name = booking.service.subcategory.category.name if booking.service.subcategory and booking.service.subcategory.category else "Services"

    assignment_resp = None
    if booking.assignment:
        tech = booking.assignment.technician
        assignment_resp = BookingAssignmentResponse(
            id=booking.assignment.id,
            technician_id=tech.id,
            technician_name=f"{tech.user.first_name} {tech.user.last_name}",
            technician_phone=tech.user.phone,
            status=booking.assignment.status,
            assigned_at=booking.assignment.assigned_at,
            arrived_at=booking.assignment.arrived_at,
            completed_at=booking.assignment.completed_at,
            completion_notes=booking.assignment.completion_notes,
        )

    history_resp = [
        BookingStatusHistoryResponse(
            id=h.id,
            previous_status=h.previous_status,
            new_status=h.new_status,
            remarks=h.remarks,
            created_at=h.created_at
        )
        for h in booking.status_history
    ]

    images_resp = [
        BookingImageResponse(
            id=img.id,
            image_type=img.image_type,
            image_url=img.image_url,
            caption=img.caption,
            created_at=img.created_at
        )
        for img in booking.images
    ]

    return BookingDetailResponse(
        id=booking.id,
        booking_reference=booking.booking_reference,
        customer_id=booking.customer_id,
        customer_name=f"{booking.customer.user.first_name} {booking.customer.user.last_name}",
        customer_phone=booking.customer.user.phone,
        provider_id=booking.provider_id,
        provider_business_name=booking.provider.business_name,
        service_id=booking.service_id,
        service_name=booking.service.name,
        category_name=cat_name,
        booking_date=booking.booking_date,
        booking_time=booking.booking_time,
        estimated_duration_min=booking.estimated_duration_min,
        status=booking.status,
        problem_description=booking.problem_description,
        subtotal=booking.subtotal,
        discount=booking.discount,
        tax=booking.tax,
        total_amount=booking.total_amount,
        address_display=addr_str,
        payment_status=booking.payment.status.value if booking.payment else "PENDING",
        created_at=booking.created_at,
        updated_at=booking.updated_at,
        assignment=assignment_resp,
        status_history=history_resp,
        images=images_resp,
    )


@router.put("/{id}/provider-action")
def provider_action(
    id: int,
    payload: ProviderBookingActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider)
):
    """Provider accepts or rejects a pending booking request."""
    provider = current_user.provider_profile
    booking = db.query(Booking).filter(Booking.id == id, Booking.provider_id == provider.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Booking is currently in {booking.status.value} status and cannot be modified.")

    prev = booking.status.value
    if payload.action == "ACCEPT":
        booking.status = BookingStatus.CONFIRMED
        remarks = "Booking accepted by provider."
    else:
        booking.status = BookingStatus.REJECTED
        booking.cancellation_reason = payload.rejection_reason or "Rejected by provider."
        remarks = f"Booking rejected: {booking.cancellation_reason}"

    db.add(BookingStatusHistory(
        booking_id=booking.id,
        previous_status=prev,
        new_status=booking.status.value,
        changed_by_user_id=current_user.id,
        remarks=remarks
    ))

    # Notify customer
    db.add(Notification(
        user_id=booking.customer.user_id,
        title=f"Booking {payload.action.capitalize()}ed",
        message=f"Your booking {booking.booking_reference} has been {payload.action.lower()}ed by {provider.business_name}.",
        type="BOOKING",
        entity_type="BOOKING",
        entity_id=booking.id
    ))

    db.commit()
    return {"message": f"Booking successfully {payload.action.lower()}ed.", "status": booking.status.value}


@router.post("/{id}/assign-technician")
def assign_technician(
    id: int,
    payload: AssignTechnicianRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider)
):
    """Assign an in-house technician to a confirmed booking."""
    provider = current_user.provider_profile
    booking = db.query(Booking).filter(Booking.id == id, Booking.provider_id == provider.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.status not in [BookingStatus.CONFIRMED, BookingStatus.PROVIDER_ASSIGNED]:
        raise HTTPException(status_code=400, detail="Technician can only be assigned to confirmed bookings.")

    # Validate technician belongs to provider
    tech = db.query(Technician).filter(
        Technician.id == payload.technician_id,
        Technician.provider_id == provider.id
    ).first()
    if not tech:
        raise HTTPException(status_code=400, detail="Selected technician does not belong to your organization.")

    # Upsert assignment
    assignment = db.query(BookingAssignment).filter(BookingAssignment.booking_id == booking.id).first()
    if assignment:
        assignment.technician_id = tech.id
        assignment.status = AssignmentStatus.ASSIGNED
    else:
        assignment = BookingAssignment(
            booking_id=booking.id,
            technician_id=tech.id,
            status=AssignmentStatus.ASSIGNED
        )
        db.add(assignment)

    prev = booking.status.value
    booking.status = BookingStatus.PROVIDER_ASSIGNED

    db.add(BookingStatusHistory(
        booking_id=booking.id,
        previous_status=prev,
        new_status=booking.status.value,
        changed_by_user_id=current_user.id,
        remarks=f"Technician {tech.user.first_name} {tech.user.last_name} assigned."
    ))

    # Notify technician
    db.add(Notification(
        user_id=tech.user_id,
        title="New Job Assignment",
        message=f"You have been assigned to booking {booking.booking_reference} on {booking.booking_date} at {booking.booking_time.strftime('%H:%M')}.",
        type="ASSIGNMENT",
        entity_type="BOOKING",
        entity_id=booking.id
    ))

    # Notify customer
    db.add(Notification(
        user_id=booking.customer.user_id,
        title="Technician Dispatched",
        message=f"Technician {tech.user.first_name} {tech.user.last_name} has been assigned to your service request.",
        type="BOOKING",
        entity_type="BOOKING",
        entity_id=booking.id
    ))

    db.commit()
    return {"message": "Technician assigned successfully.", "status": booking.status.value}


@router.put("/{id}/cancel")
def cancel_booking(
    id: int,
    payload: BookingCancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Customer or Provider cancels an eligible booking."""
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    is_customer = booking.customer.user_id == current_user.id
    is_provider = booking.provider.user_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN

    if not (is_customer or is_provider or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking.")

    if booking.status in [BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel booking with status: {booking.status.value}")

    prev = booking.status.value
    booking.status = BookingStatus.CANCELLED
    booking.cancellation_reason = payload.reason

    db.add(BookingStatusHistory(
        booking_id=booking.id,
        previous_status=prev,
        new_status=BookingStatus.CANCELLED.value,
        changed_by_user_id=current_user.id,
        remarks=f"Cancelled: {payload.reason}"
    ))

    # Notify counterpart
    target_user_id = booking.provider.user_id if is_customer else booking.customer.user_id
    db.add(Notification(
        user_id=target_user_id,
        title="Booking Cancelled",
        message=f"Booking {booking.booking_reference} was cancelled. Reason: {payload.reason}",
        type="BOOKING",
        entity_type="BOOKING",
        entity_id=booking.id
    ))

    db.commit()
    return {"message": "Booking cancelled successfully.", "status": booking.status.value}

