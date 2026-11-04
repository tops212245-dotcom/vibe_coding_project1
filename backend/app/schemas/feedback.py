from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.feedback import ComplaintStatus


class ReviewCreateRequest(BaseModel):
    booking_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)


class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    customer_name: str
    rating: int
    comment: Optional[str]
    reply: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewReplyRequest(BaseModel):
    response_text: str = Field(..., min_length=2, max_length=1000)


class ComplaintCreateRequest(BaseModel):
    booking_id: int
    category: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10, max_length=2000)


class ComplaintResponse(BaseModel):
    id: int
    ticket_number: str
    booking_id: int
    booking_reference: str
    category: str
    description: str
    status: ComplaintStatus
    admin_resolution: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class ComplaintResolveRequest(BaseModel):
    status: ComplaintStatus
    resolution_notes: str = Field(..., min_length=5)


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminAnalyticsResponse(BaseModel):
    total_customers: int
    total_providers: int
    approved_providers: int
    pending_providers: int
    total_technicians: int
    total_bookings: int
    pending_bookings: int
    completed_bookings: int
    cancelled_bookings: int
    total_revenue: Decimal
    total_commission: Decimal
    total_provider_earnings: Decimal


class ProviderAnalyticsResponse(BaseModel):
    total_bookings: int
    today_bookings: int
    pending_requests: int
    confirmed_bookings: int
    completed_services: int
    cancelled_bookings: int
    total_earnings: Decimal
    platform_commissions: Decimal
    average_rating: Decimal
    total_technicians: int

