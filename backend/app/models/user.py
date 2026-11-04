from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, Enum, DECIMAL
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    CUSTOMER = "CUSTOMER"
    PROVIDER = "PROVIDER"
    TECHNICIAN = "TECHNICIAN"


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    SUSPENDED = "SUSPENDED"
    INACTIVE = "INACTIVE"


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CUSTOMER)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    profile_image_url = Column(String(500), nullable=True)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    customer_profile = relationship("Customer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    provider_profile = relationship("ServiceProvider", back_populates="user", uselist=False, cascade="all, delete-orphan")
    technician_profile = relationship("Technician", back_populates="user", uselist=False, cascade="all, delete-orphan")
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    default_address_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="customer_profile")
    bookings = relationship("Booking", back_populates="customer")
    favorites = relationship("Favorite", back_populates="customer", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="customer")


class ServiceProvider(Base):
    __tablename__ = "service_providers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    business_name = Column(String(255), nullable=False)
    business_reg_no = Column(String(100), nullable=True)
    tax_id = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    experience_years = Column(Integer, default=0)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, index=True)
    verification_notes = Column(Text, nullable=True)
    id_proof_url = Column(String(500), nullable=True)
    business_proof_url = Column(String(500), nullable=True)
    average_rating = Column(DECIMAL(3, 2), default=0.00)
    total_reviews = Column(Integer, default=0)
    commission_rate = Column(DECIMAL(5, 2), default=10.00)  # Percentage, e.g. 10.00%
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="provider_profile")
    technicians = relationship("Technician", back_populates="provider", cascade="all, delete-orphan")
    services = relationship("ProviderService", back_populates="provider", cascade="all, delete-orphan")
    working_hours = relationship("ProviderWorkingHour", back_populates="provider", cascade="all, delete-orphan")
    service_areas = relationship("ServiceArea", back_populates="provider", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="provider")
    earnings = relationship("ProviderEarning", back_populates="provider")
    payouts = relationship("ProviderPayout", back_populates="provider")
    reviews = relationship("Review", back_populates="provider")


class Technician(Base):
    __tablename__ = "technicians"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    specialization = Column(String(255), nullable=True)
    is_available = Column(Boolean, default=True)
    rating = Column(DECIMAL(3, 2), default=5.00)
    total_jobs = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="technician_profile")
    provider = relationship("ServiceProvider", back_populates="technicians")
    assignments = relationship("BookingAssignment", back_populates="technician")


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(100), nullable=False, default="Home")
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False, index=True)
    country = Column(String(100), default="India")
    latitude = Column(DECIMAL(10, 8), nullable=True)
    longitude = Column(DECIMAL(11, 8), nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="addresses")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="refresh_tokens")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

