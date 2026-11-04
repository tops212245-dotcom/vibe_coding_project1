from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, Enum, DECIMAL, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PayoutStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    FAILED = "FAILED"


class DiscountType(str, enum.Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED = "FIXED"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    razorpay_order_id = Column(String(100), unique=True, nullable=True, index=True)
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    payment_method = Column(String(50), nullable=True)  # RAZORPAY, SIMULATED, CASH
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    booking = relationship("Booking", back_populates="payment")
    transactions = relationship("PaymentTransaction", back_populates="payment", cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="payment", uselist=False)


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True)
    razorpay_payment_id = Column(String(100), unique=True, nullable=True, index=True)
    razorpay_signature = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False)  # SUCCESS, FAILED
    gateway_response = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    payment = relationship("Payment", back_populates="transactions")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    
    customer_name = Column(String(200), nullable=False)
    provider_business_name = Column(String(255), nullable=False)
    service_name = Column(String(200), nullable=False)
    
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    discount_amount = Column(DECIMAL(10, 2), default=0.00)
    tax_amount = Column(DECIMAL(10, 2), default=0.00)
    total_paid = Column(DECIMAL(10, 2), nullable=False)
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    booking = relationship("Booking", back_populates="invoice")
    payment = relationship("Payment", back_populates="invoice")


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_type = Column(Enum(DiscountType), nullable=False)
    discount_value = Column(DECIMAL(10, 2), nullable=False)
    min_order_amount = Column(DECIMAL(10, 2), default=0.00)
    max_discount_amount = Column(DECIMAL(10, 2), nullable=True)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    usage_limit = Column(Integer, default=100)
    times_used = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CouponUsage(Base):
    __tablename__ = "coupon_usages"

    id = Column(Integer, primary_key=True, index=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    discount_applied = Column(DECIMAL(10, 2), nullable=False)
    used_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ProviderEarning(Base):
    __tablename__ = "provider_earnings"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    gross_amount = Column(DECIMAL(10, 2), nullable=False)
    platform_commission = Column(DECIMAL(10, 2), nullable=False)
    net_earning = Column(DECIMAL(10, 2), nullable=False)
    is_paid_out = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    provider = relationship("ServiceProvider", back_populates="earnings")
    booking = relationship("Booking", back_populates="earning")


class ProviderPayout(Base):
    __tablename__ = "provider_payouts"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=False, index=True)
    amount = Column(DECIMAL(10, 2), nullable=False)
    status = Column(Enum(PayoutStatus), default=PayoutStatus.PENDING, nullable=False)
    transaction_reference = Column(String(100), nullable=True)
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    provider = relationship("ServiceProvider", back_populates="payouts")

