import pytest
import secrets
from app.api.v1.payments import create_payment_order, verify_payment
from app.api.v1.invoices import get_invoice_by_booking
from app.api.v1.complaints import raise_complaint, list_complaints, resolve_complaint
from app.api.v1.analytics import get_admin_analytics
from app.schemas.finance import CreateOrderRequest, VerifyPaymentRequest
from app.schemas.feedback import ComplaintCreateRequest, ComplaintResolveRequest

def test_payments_and_invoicing(db, customer_user, completed_booking):
    # 1. Create payment order
    order_req = CreateOrderRequest(booking_id=completed_booking.id)
    order_res = create_payment_order(payload=order_req, db=db, current_user=customer_user)
    assert order_res.booking_id == completed_booking.id
    assert order_res.order_id is not None

    # 2. Verify simulated payment
    verify_req = VerifyPaymentRequest(
        booking_id=completed_booking.id,
        razorpay_order_id=order_res.order_id,
        razorpay_payment_id=f"pay_sim_{secrets.token_hex(6)}",
        razorpay_signature="sim_sig_test_12345",
        is_simulation=True
    )
    verify_res = verify_payment(payload=verify_req, db=db, current_user=customer_user)
    assert verify_res.invoice_number.startswith("INV-")
    assert verify_res.total_paid > 0

    # 3. Fetch tax invoice
    invoice = get_invoice_by_booking(booking_id=completed_booking.id, db=db, current_user=customer_user)
    assert invoice.booking_id == completed_booking.id
    assert invoice.invoice_number.startswith("INV-")
    assert invoice.total_paid > 0

def test_complaints_and_resolution(db, customer_user, admin_user, completed_booking):
    # 1. Customer lodges complaint
    comp_req = ComplaintCreateRequest(
        booking_id=completed_booking.id,
        category="SERVICE_QUALITY",
        description="Technician finished repair well but left packaging behind."
    )
    complaint = raise_complaint(payload=comp_req, db=db, current_user=customer_user)
    assert complaint.id is not None
    assert complaint.status.value == "OPEN"

    # 2. Admin retrieves dispute
    all_complaints = list_complaints(db=db, current_user=admin_user)
    assert any(c.id == complaint.id for c in all_complaints)

    # 3. Admin resolves complaint
    resolve_req = ComplaintResolveRequest(
        status="RESOLVED",
        resolution_notes="Issued platform apologies and customer goodwill credit."
    )
    resolved = resolve_complaint(id=complaint.id, payload=resolve_req, db=db, admin=admin_user)
    assert resolved.status.value == "RESOLVED"

def test_admin_real_database_analytics(db, admin_user):
    analytics = get_admin_analytics(db=db, admin=admin_user)
    assert analytics.total_customers >= 1
    assert analytics.total_providers >= 1
    assert analytics.total_technicians >= 1
    assert analytics.total_bookings >= 0
    assert analytics.total_revenue >= 0
    assert analytics.total_commission >= 0
