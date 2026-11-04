from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.permissions import require_technician
from app.models.user import User, Technician
from app.models.booking import (
    Booking, BookingAssignment, BookingStatusHistory, BookingImage,
    BookingStatus, AssignmentStatus, BookingImageType
)
from app.models.finance import ProviderEarning, Payment, PaymentStatus
from app.models.feedback import Notification

router = APIRouter(prefix="/technicians", tags=["Technician Field Dispatch"])


class JobCompletionRequest(BaseModel):
    completion_notes: str = Field(..., min_length=5)
    after_service_image_url: Optional[str] = None


@router.get("/me/jobs")
def get_assigned_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_technician)
):
    """View assigned jobs queue for current field technician."""
    tech = current_user.technician_profile
    assignments = db.query(BookingAssignment).options(
        joinedload(BookingAssignment.booking).joinedload(Booking.service),
        joinedload(BookingAssignment.booking).joinedload(Booking.address),
        joinedload(BookingAssignment.booking).joinedload(Booking.customer).joinedload(Booking.customer.property.mapper.class_.user)
    ).filter(BookingAssignment.technician_id == tech.id).order_by(BookingAssignment.assigned_at.desc()).all()

    jobs = []
    for a in assignments:
        b = a.booking
        jobs.append({
            "assignment_id": a.id,
            "booking_id": b.id,
            "booking_reference": b.booking_reference,
            "service_name": b.service.name,
            "booking_date": b.booking_date.isoformat(),
            "booking_time": b.booking_time.strftime("%H:%M"),
            "customer_name": f"{b.customer.user.first_name} {b.customer.user.last_name}",
            "customer_phone": b.customer.user.phone,
            "address": f"{b.address.address_line1}, {b.address.city} - {b.address.postal_code}",
            "problem_description": b.problem_description,
            "assignment_status": a.status.value,
            "booking_status": b.status.value,
            "total_amount": float(b.total_amount),
        })
    return jobs


@router.put("/me/jobs/{id}/acknowledge")
def acknowledge_job(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_technician)
):
    """Technician acknowledges the job ticket."""
    tech = current_user.technician_profile
    assignment = db.query(BookingAssignment).filter(
        BookingAssignment.booking_id == id,
        BookingAssignment.technician_id == tech.id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Job assignment not found.")

    assignment.status = AssignmentStatus.ACKNOWLEDGED
    assignment.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Job acknowledged."}


@router.put("/me/jobs/{id}/arrive")
def mark_arrival(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_technician)
):
    """Mark technician arrival at customer site."""
    tech = current_user.technician_profile
    assignment = db.query(BookingAssignment).filter(
        BookingAssignment.booking_id == id,
        BookingAssignment.technician_id == tech.id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Job assignment not found.")

    assignment.status = AssignmentStatus.ARRIVED
    assignment.arrived_at = datetime.now(timezone.utc)
    
    # Notify customer
    b = assignment.booking
    db.add(Notification(
        user_id=b.customer.user_id,
        title="Technician Arrived",
        message=f"{current_user.first_name} {current_user.last_name} has arrived at your address.",
        type="BOOKING",
        entity_type="BOOKING",
        entity_id=b.id
    ))

    db.commit()
    return {"message": "Arrival recorded."}


@router.put("/me/jobs/{id}/start")
def start_job(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_technician)
):
    """Start service execution."""
    tech = current_user.technician_profile
    assignment = db.query(BookingAssignment).filter(
        BookingAssignment.booking_id == id,
        BookingAssignment.technician_id == tech.id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Job assignment not found.")

    assignment.status = AssignmentStatus.IN_PROGRESS
    b = assignment.booking
    b.status = BookingStatus.IN_PROGRESS

    db.add(BookingStatusHistory(
        booking_id=b.id,
        previous_status=BookingStatus.PROVIDER_ASSIGNED.value,
        new_status=BookingStatus.IN_PROGRESS.value,
        changed_by_user_id=current_user.id,
        remarks="Service started by technician."
    ))

    db.commit()
    return {"message": "Service started."}


@router.put("/me/jobs/{id}/complete")
def complete_job(
    id: int,
    payload: JobCompletionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_technician)
):
    """Mark service completed, save completion notes, and trigger accounting."""
    tech = current_user.technician_profile
    assignment = db.query(BookingAssignment).filter(
        BookingAssignment.booking_id == id,
        BookingAssignment.technician_id == tech.id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Job assignment not found.")

    now = datetime.now(timezone.utc)
    assignment.status = AssignmentStatus.COMPLETED
    assignment.completed_at = now
    assignment.completion_notes = payload.completion_notes

    b = assignment.booking
    prev = b.status.value
    b.status = BookingStatus.COMPLETED

    tech.total_jobs += 1

    if payload.after_service_image_url:
        db.add(BookingImage(
            booking_id=b.id,
            image_type=BookingImageType.AFTER_SERVICE,
            image_url=payload.after_service_image_url,
            caption="Job completion photo",
            uploaded_by_user_id=current_user.id
        ))

    db.add(BookingStatusHistory(
        booking_id=b.id,
        previous_status=prev,
        new_status=BookingStatus.COMPLETED.value,
        changed_by_user_id=current_user.id,
        remarks=f"Completed: {payload.completion_notes}"
    ))

    # Calculate provider earning and commission record if not exists
    existing_earning = db.query(ProviderEarning).filter(ProviderEarning.booking_id == b.id).first()
    if not existing_earning:
        comm_pct = b.provider.commission_rate or Decimal("10.00")
        comm_amount = (b.subtotal * comm_pct) / Decimal("100.00")
        net_earning = max(b.subtotal - comm_amount, Decimal("0.00"))
        db.add(ProviderEarning(
            provider_id=b.provider_id,
            booking_id=b.id,
            gross_amount=b.subtotal,
            platform_commission=comm_amount,
            net_earning=net_earning,
            is_paid_out=False
        ))

    # Notify customer & provider
    db.add(Notification(
        user_id=b.customer.user_id,
        title="Service Completed!",
        message=f"Service {b.service.name} has been marked completed. You can now leave a review.",
        type="BOOKING",
        entity_type="BOOKING",
        entity_id=b.id
    ))
    db.add(Notification(
        user_id=b.provider.user_id,
        title="Job Completed",
        message=f"Technician completed booking {b.booking_reference}.",
        type="BOOKING",
        entity_type="BOOKING",
        entity_id=b.id
    ))

    db.commit()
    return {"message": "Service successfully completed."}

