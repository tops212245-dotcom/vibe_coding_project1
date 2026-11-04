import secrets
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.permissions import get_current_active_user, require_admin
from app.models.user import User, UserRole
from app.models.booking import Booking
from app.models.feedback import Complaint, ComplaintStatus
from app.schemas.feedback import ComplaintCreateRequest, ComplaintResponse, ComplaintResolveRequest

router = APIRouter(prefix="/complaints", tags=["Disputes & Complaints"])


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def raise_complaint(
    payload: ComplaintCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """File a formal dispute ticket regarding a booking."""
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    ticket = f"CMP-{datetime.now().year}-{secrets.token_hex(3).upper()}"
    complaint = Complaint(
        ticket_number=ticket,
        booking_id=booking.id,
        user_id=current_user.id,
        category=payload.category,
        description=payload.description,
        status=ComplaintStatus.OPEN
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    return ComplaintResponse(
        id=complaint.id,
        ticket_number=complaint.ticket_number,
        booking_id=booking.id,
        booking_reference=booking.booking_reference,
        category=complaint.category,
        description=complaint.description,
        status=complaint.status,
        admin_resolution=complaint.admin_resolution,
        created_at=complaint.created_at,
        resolved_at=complaint.resolved_at
    )


@router.get("", response_model=List[ComplaintResponse])
def list_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List complaints: Super Admin views all; other users view their own tickets."""
    query = db.query(Complaint).options(joinedload(Complaint.booking))
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Complaint.user_id == current_user.id)

    complaints = query.order_by(Complaint.created_at.desc()).all()
    return [
        ComplaintResponse(
            id=c.id,
            ticket_number=c.ticket_number,
            booking_id=c.booking_id,
            booking_reference=c.booking.booking_reference,
            category=c.category,
            description=c.description,
            status=c.status,
            admin_resolution=c.admin_resolution,
            created_at=c.created_at,
            resolved_at=c.resolved_at
        )
        for c in complaints
    ]


@router.put("/{id}/resolve", response_model=ComplaintResponse)
def resolve_complaint(
    id: int,
    payload: ComplaintResolveRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Admin resolves or dismisses a dispute ticket."""
    complaint = db.query(Complaint).options(joinedload(Complaint.booking)).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    complaint.status = payload.status
    complaint.admin_resolution = payload.resolution_notes
    complaint.resolved_by_user_id = admin.id
    complaint.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(complaint)

    return ComplaintResponse(
        id=complaint.id,
        ticket_number=complaint.ticket_number,
        booking_id=complaint.booking_id,
        booking_reference=complaint.booking.booking_reference,
        category=complaint.category,
        description=complaint.description,
        status=complaint.status,
        admin_resolution=complaint.admin_resolution,
        created_at=complaint.created_at,
        resolved_at=complaint.resolved_at
    )

