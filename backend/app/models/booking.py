from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Date, Time,
    ForeignKey, Enum, DECIMAL, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PROVIDER_ASSIGNED = "PROVIDER_ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    ARRIVED = "ARRIVED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    REASSIGNED = "REASSIGNED"


class BookingImageType(str, enum.Enum):
    CUSTOMER_REFERENCE = "CUSTOMER_REFERENCE"
    BEFORE_SERVICE = "BEFORE_SERVICE"
    AFTER_SERVICE = "AFTER_SERVICE"


class ProviderWorkingHour(Base):
    __tablename__ = "provider_working_hours"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_closed = Column(Boolean, default=False)

    provider = relationship("ServiceProvider", back_populates="working_hours")

    __table_args__ = (
        UniqueConstraint("provider_id", "day_of_week", name="uk_provider_day"),
    )


class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_booked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("provider_id", "slot_date", "start_time", name="uk_provider_slot"),
    )


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(32), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False, index=True)
    address_id = Column(Integer, ForeignKey("addresses.id"), nullable=False)
    
    booking_date = Column(Date, nullable=False, index=True)
    booking_time = Column(Time, nullable=False)
    estimated_duration_min = Column(Integer, default=60, nullable=False)
    
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False, index=True)
    problem_description = Column(Text, nullable=True)
    
    # Financial breakdown
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    discount = Column(DECIMAL(10, 2), default=0.00)
    tax = Column(DECIMAL(10, 2), default=0.00)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    
    cancellation_reason = Column(Text, nullable=True)
    rescheduled_from_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    customer = relationship("Customer", back_populates="bookings")
    provider = relationship("ServiceProvider", back_populates="bookings")
    service = relationship("Service", back_populates="bookings")
    address = relationship("Address")
    
    assignment = relationship("BookingAssignment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    status_history = relationship("BookingStatusHistory", back_populates="booking", cascade="all, delete-orphan")
    images = relationship("BookingImage", back_populates="booking", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="booking", uselist=False)
    invoice = relationship("Invoice", back_populates="booking", uselist=False)
    earning = relationship("ProviderEarning", back_populates="booking", uselist=False)
    review = relationship("Review", back_populates="booking", uselist=False)
    complaints = relationship("Complaint", back_populates="booking")

    __table_args__ = (
        Index("idx_provider_date_status", "provider_id", "booking_date", "status"),
    )


class BookingAssignment(Base):
    __tablename__ = "booking_assignments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False, index=True)
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    acknowledged_at = Column(DateTime, nullable=True)
    arrived_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.ASSIGNED, nullable=False)
    completion_notes = Column(Text, nullable=True)

    booking = relationship("Booking", back_populates="assignment")
    technician = relationship("Technician", back_populates="assignments")


class BookingStatusHistory(Base):
    __tablename__ = "booking_status_history"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    booking = relationship("Booking", back_populates="status_history")


class BookingImage(Base):
    __tablename__ = "booking_images"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    image_type = Column(Enum(BookingImageType), nullable=False)
    image_url = Column(String(500), nullable=False)
    caption = Column(String(255), nullable=True)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    booking = relationship("Booking", back_populates="images")

