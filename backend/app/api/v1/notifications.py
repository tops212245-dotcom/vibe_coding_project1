from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_active_user
from app.models.user import User
from app.models.feedback import Notification
from app.schemas.feedback import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])


@router.get("", response_model=List[NotificationResponse])
def get_user_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve notifications for the current authenticated user."""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(limit).all()
    return notifications


@router.put("/{id}/read")
def mark_notification_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark single notification as read."""
    n = db.query(Notification).filter(Notification.id == id, Notification.user_id == current_user.id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found.")
    n.is_read = True
    db.commit()
    return {"message": "Notification marked as read."}


@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark all unread notifications as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read."}

