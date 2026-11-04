from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, DECIMAL, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class ServiceCategory(Base):
    __tablename__ = "service_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    subcategories = relationship("ServiceSubcategory", back_populates="category", cascade="all, delete-orphan")


class ServiceSubcategory(Base):
    __tablename__ = "service_subcategories"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("service_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    category = relationship("ServiceCategory", back_populates="subcategories")
    services = relationship("Service", back_populates="subcategory", cascade="all, delete-orphan")


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    subcategory_id = Column(Integer, ForeignKey("service_subcategories.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    slug = Column(String(220), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    base_price = Column(DECIMAL(10, 2), nullable=False)
    estimated_duration_min = Column(Integer, default=60, nullable=False)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    subcategory = relationship("ServiceSubcategory", back_populates="services")
    provider_services = relationship("ProviderService", back_populates="service", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="service")


class ProviderService(Base):
    __tablename__ = "provider_services"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    custom_price = Column(DECIMAL(10, 2), nullable=False)
    duration_min = Column(Integer, default=60, nullable=False)
    is_available = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    provider = relationship("ServiceProvider", back_populates="services")
    service = relationship("Service", back_populates="provider_services")

    __table_args__ = (
        UniqueConstraint("provider_id", "service_id", name="uk_provider_service"),
    )


class ServiceArea(Base):
    __tablename__ = "service_areas"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    postal_code = Column(String(20), nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    provider = relationship("ServiceProvider", back_populates="service_areas")

