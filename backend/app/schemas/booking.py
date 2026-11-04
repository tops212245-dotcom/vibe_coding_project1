from datetime import date, time, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.booking import BookingStatus, AssignmentStatus, BookingImageType


class SlotCheckRequest(BaseModel):
    provider_id: int
    service_id: int
    booking_date: date
    booking_time: str  # Format: "HH:MM" e.g. "10:00"


class SlotCheckResponse(BaseModel):
    is_available: bool
    reason: Optional[str] = None
    estimated_duration_min: int
    calculated_price: Decimal


class BookingCreateRequest(BaseModel):
    provider_id: int
    service_id: int
    address_id: int
    booking_date: date
    booking_time: str  # Format: "HH:MM"
    problem_description: Optional[str] = None
    coupon_code: Optional[str] = None


class BookingStatusHistoryResponse(BaseModel):
    id: int
    previous_status: Optional[str]
    new_status: str
    remarks: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class BookingImageResponse(BaseModel):
    id: int
    image_type: BookingImageType
    image_url: str
    caption: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class BookingAssignmentResponse(BaseModel):
    id: int
    technician_id: int
    technician_name: str
    technician_phone: Optional[str]
    status: AssignmentStatus
    assigned_at: datetime
    arrived_at: Optional[datetime]
    completed_at: Optional[datetime]
    completion_notes: Optional[str]

    class Config:
        from_attributes = True


class BookingResponse(BaseModel):
    id: int
    booking_reference: str
    customer_id: int
    customer_name: str
    customer_phone: Optional[str]
    provider_id: int
    provider_business_name: str
    service_id: int
    service_name: str
    category_name: str
    booking_date: date
    booking_time: time
    estimated_duration_min: int
    status: BookingStatus
    problem_description: Optional[str]
    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    total_amount: Decimal
    address_display: str
    payment_status: Optional[str] = "PENDING"
    created_at: datetime
    updated_at: datetime
    assignment: Optional[BookingAssignmentResponse] = None

    class Config:
        from_attributes = True


class BookingDetailResponse(BookingResponse):
    status_history: List[BookingStatusHistoryResponse] = []
    images: List[BookingImageResponse] = []


class ProviderBookingActionRequest(BaseModel):
    action: str = Field(..., pattern="^(ACCEPT|REJECT)$")
    rejection_reason: Optional[str] = None


class AssignTechnicianRequest(BaseModel):
    technician_id: int


class BookingCancelRequest(BaseModel):
    reason: str = Field(..., min_length=3)


class BookingRescheduleRequest(BaseModel):
    new_date: date
    new_time: str  # "HH:MM"
    reason: Optional[str] = None
