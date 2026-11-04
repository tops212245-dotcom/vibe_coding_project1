from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.finance import PaymentStatus, PayoutStatus


class CreateOrderRequest(BaseModel):
    booking_id: int


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: Decimal  # In rupees
    amount_in_paise: int
    currency: str
    razorpay_key_id: str
    is_simulation: bool
    booking_id: int
    booking_reference: str


class VerifyPaymentRequest(BaseModel):
    booking_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    is_simulation: bool = False


class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    booking_reference: str
    amount: Decimal
    currency: str
    status: PaymentStatus
    payment_method: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    booking_id: int
    booking_reference: str
    customer_name: str
    provider_business_name: str
    service_name: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_paid: Decimal
    issued_at: datetime

    class Config:
        from_attributes = True


class CouponValidateRequest(BaseModel):
    code: str
    order_amount: Decimal


class CouponValidateResponse(BaseModel):
    is_valid: bool
    code: str
    discount_amount: Decimal
    final_amount: Decimal
    message: Optional[str] = None


class ProviderEarningsResponse(BaseModel):
    total_gross: Decimal
    total_commission: Decimal
    total_net: Decimal
    pending_payout: Decimal
    total_paid_out: Decimal

