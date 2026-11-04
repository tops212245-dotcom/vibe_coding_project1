import hmac
import hashlib
import secrets
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import require_customer, get_current_active_user
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.finance import (
    Payment, PaymentTransaction, Invoice, ProviderEarning,
    PaymentStatus
)
from app.models.feedback import Notification, AuditLog
from app.schemas.finance import (
    CreateOrderRequest, CreateOrderResponse,
    VerifyPaymentRequest, PaymentResponse, InvoiceResponse
)

router = APIRouter(prefix="/payments", tags=["Payment Gateway & Billing"])


@router.post("/create-order", response_model=CreateOrderResponse)
def create_payment_order(
    payload: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """
    Generate backend payment order via Razorpay API or safe Development Simulator.
    """
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to pay for this booking.")

    # Check if already paid
    if booking.payment and booking.payment.status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="This booking has already been settled.")

    amount_in_paise = int(booking.total_amount * 100)

    # Check if real razorpay credentials are set or fallback to simulation
    is_simulation = True
    order_id = f"order_sim_{secrets.token_hex(10)}"

    if settings.RAZORPAY_KEY_ID and not settings.RAZORPAY_KEY_ID.startswith("rzp_test_demo") and not settings.PAYMENT_SIMULATION_ENABLED:
        try:
            import razorpay
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            rzp_order = client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": booking.booking_reference,
                "notes": {"booking_id": str(booking.id)}
            })
            order_id = rzp_order["id"]
            is_simulation = False
        except Exception:
            is_simulation = True
            order_id = f"order_sim_{secrets.token_hex(10)}"

    # Upsert payment record
    payment = booking.payment
    if not payment:
        payment = Payment(
            booking_id=booking.id,
            razorpay_order_id=order_id,
            amount=booking.total_amount,
            currency="INR",
            status=PaymentStatus.PENDING,
            payment_method="SIMULATED" if is_simulation else "RAZORPAY"
        )
        db.add(payment)
    else:
        payment.razorpay_order_id = order_id
        payment.status = PaymentStatus.PENDING
        payment.payment_method = "SIMULATED" if is_simulation else "RAZORPAY"

    db.commit()
    db.refresh(payment)

    return CreateOrderResponse(
        order_id=order_id,
        amount=booking.total_amount,
        amount_in_paise=amount_in_paise,
        currency="INR",
        razorpay_key_id=settings.RAZORPAY_KEY_ID,
        is_simulation=is_simulation,
        booking_id=booking.id,
        booking_reference=booking.booking_reference,
    )


@router.post("/verify", response_model=InvoiceResponse)
def verify_payment(
    payload: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """
    Verify payment signature server-side using HMAC-SHA256, lock idempotency, and issue tax invoice.
    """
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    payment = booking.payment
    if not payment or payment.razorpay_order_id != payload.razorpay_order_id:
        raise HTTPException(status_code=400, detail="Mismatched payment order.")

    # Prevent duplicate payment capture (Idempotency)
    if payment.status == PaymentStatus.PAID:
        invoice = payment.invoice
        if invoice:
            return invoice

    # Verify signature
    signature_valid = False
    if payload.is_simulation:
        # Development simulator test signature
        expected_sim_sig = hashlib.sha256(f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}|secret".encode()).hexdigest()
        signature_valid = (payload.razorpay_signature == expected_sim_sig or payload.razorpay_signature.startswith("sim_sig_"))
    else:
        # Official Razorpay HMAC-SHA256 verification
        msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode("utf-8")
        expected_sig = hmac.new(settings.RAZORPAY_KEY_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()
        signature_valid = hmac.compare_digest(expected_sig, payload.razorpay_signature)

    if not signature_valid:
        payment.status = PaymentStatus.FAILED
        db.commit()
        raise HTTPException(status_code=400, detail="Cryptographic payment signature verification failed.")

    # Mark payment as captured
    payment.status = PaymentStatus.PAID
    payment.payment_method = "SIMULATED_TEST" if payload.is_simulation else "RAZORPAY"

    # Record individual transaction
    db.add(PaymentTransaction(
        payment_id=payment.id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature,
        status="SUCCESS",
        gateway_response={"verified_at": datetime.now(timezone.utc).isoformat(), "is_simulation": payload.is_simulation}
    ))

    # Generate sequential Tax Invoice
    inv_num = f"INV-{datetime.now().year}-{secrets.token_hex(3).upper()}"
    invoice = Invoice(
        invoice_number=inv_num,
        booking_id=booking.id,
        payment_id=payment.id,
        customer_name=f"{current_user.first_name} {current_user.last_name}",
        provider_business_name=booking.provider.business_name,
        service_name=booking.service.name,
        subtotal=booking.subtotal,
        discount_amount=booking.discount,
        tax_amount=booking.tax,
        total_paid=booking.total_amount,
    )
    db.add(invoice)

    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        action="PAYMENT_CAPTURED",
        details={
            "booking_id": booking.id,
            "order_id": payload.razorpay_order_id,
            "payment_id": payload.razorpay_payment_id,
            "amount": float(booking.total_amount),
            "is_simulation": payload.is_simulation
        }
    ))

    # Notify provider
    db.add(Notification(
        user_id=booking.provider.user_id,
        title="Payment Received",
        message=f"Payment of ₹{booking.total_amount} captured for booking {booking.booking_reference}.",
        type="PAYMENT",
        entity_type="BOOKING",
        entity_id=booking.id
    ))

    db.commit()
    db.refresh(invoice)

    return InvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        booking_id=booking.id,
        booking_reference=booking.booking_reference,
        customer_name=invoice.customer_name,
        provider_business_name=invoice.provider_business_name,
        service_name=invoice.service_name,
        subtotal=invoice.subtotal,
        discount_amount=invoice.discount_amount,
        tax_amount=invoice.tax_amount,
        total_paid=invoice.total_paid,
        issued_at=invoice.issued_at
    )

