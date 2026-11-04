import pytest
import secrets
from datetime import date, time, timedelta
from decimal import Decimal
from fastapi import HTTPException
from app.api.v1.bookings import (
    check_availability, create_booking, provider_action,
    assign_technician, check_slot_conflict
)
from app.api.v1.technicians import acknowledge_job, mark_arrival, start_job, complete_job, JobCompletionRequest
from app.schemas.booking import (
    SlotCheckRequest, BookingCreateRequest, ProviderBookingActionRequest,
    AssignTechnicianRequest
)
from app.models.user import Customer, ServiceProvider, Technician, Address
from app.models.booking import Booking, BookingStatus, AssignmentStatus
from app.models.finance import ProviderEarning

def test_full_booking_lifecycle_and_double_booking_protection(db, customer_user, provider_user, technician_user):
    customer = customer_user.customer_profile
    provider = provider_user.provider_profile
    tech = technician_user.technician_profile
    address = db.query(Address).filter(Address.user_id == customer_user.id).first()

    # Pick a fresh random weekday and slot to ensure isolation across repeated test runs
    rand_day = 12 + secrets.randbelow(15)
    booking_date = date.today() + timedelta(days=rand_day)
    if booking_date.weekday() == 6:  # Sunday
        booking_date += timedelta(days=1)
    
    rand_hour = 10 + secrets.randbelow(6)
    slot_time = f"{rand_hour:02d}:00"

    # 1. Check availability
    slot_req = SlotCheckRequest(
        provider_id=provider.id,
        service_id=1,
        booking_date=booking_date,
        booking_time=slot_time
    )
    avail = check_availability(payload=slot_req, db=db)
    assert avail.is_available is True

    # 2. Customer creates booking
    book_req = BookingCreateRequest(
        provider_id=provider.id,
        service_id=1,
        address_id=address.id,
        booking_date=booking_date,
        booking_time=slot_time,
        problem_description="Test repair lifecycle",
        coupon_code="WELCOME50"
    )
    booking = create_booking(payload=book_req, db=db, current_user=customer_user)
    assert booking.id is not None
    assert booking.booking_reference.startswith("BK-")
    assert booking.status == BookingStatus.PENDING

    # 3. Provider accepts booking
    act_req = ProviderBookingActionRequest(action="ACCEPT", remarks="Approved by vendor")
    provider_action(id=booking.id, payload=act_req, db=db, current_user=provider_user)
    b_record = db.query(Booking).filter(Booking.id == booking.id).first()
    assert b_record.status == BookingStatus.CONFIRMED

    # 4. CRITICAL DOUBLE BOOKING CONFLICT TEST
    # Now that the booking is CONFIRMED, checking or booking the same slot must report conflict!
    conflict_reason = check_slot_conflict(
        db=db,
        provider_id=provider.id,
        booking_date=booking_date,
        start_t=time(rand_hour, 0),
        duration_min=45
    )
    assert conflict_reason is not None
    assert "conflicts with an existing booking" in conflict_reason

    # Attempting to create booking for overlapping slot must raise 409
    with pytest.raises(HTTPException) as exc:
        create_booking(payload=book_req, db=db, current_user=customer_user)
    assert exc.value.status_code == 409

    # 5. Provider assigns technician
    assign_req = AssignTechnicianRequest(technician_id=tech.id, instructions="Inspect wiring first")
    assign_technician(id=booking.id, payload=assign_req, db=db, current_user=provider_user)
    db.expire_all()
    b_record = db.query(Booking).filter(Booking.id == booking.id).first()
    assert b_record.status == BookingStatus.PROVIDER_ASSIGNED

    # 6. Technician acknowledges job
    ack_res = acknowledge_job(id=booking.id, db=db, current_user=technician_user)
    assert ack_res["message"] == "Job acknowledged."

    # 7. Technician marks arrival at customer location
    arrive_res = mark_arrival(id=booking.id, db=db, current_user=technician_user)
    assert arrive_res["message"] == "Arrival recorded."

    # 8. Technician starts service
    start_res = start_job(id=booking.id, db=db, current_user=technician_user)
    assert start_res["message"] == "Service started."

    # 9. Technician completes service with notes and image
    comp_req = JobCompletionRequest(
        completion_notes="Repairs tested and complete. Voltage stabilized.",
        after_service_image_url="https://res.cloudinary.com/demo/image/upload/v1/after_repair.jpg"
    )
    comp_res = complete_job(id=booking.id, payload=comp_req, db=db, current_user=technician_user)
    assert comp_res["message"] == "Service successfully completed."

    # 10. Verify database financial accounting records
    db.expire_all()
    b_record = db.query(Booking).filter(Booking.id == booking.id).first()
    assert b_record.status == BookingStatus.COMPLETED

    earning = db.query(ProviderEarning).filter(ProviderEarning.booking_id == booking.id).first()
    assert earning is not None
    assert earning.provider_id == provider.id
    assert earning.gross_amount > 0
    assert earning.platform_commission > 0
    assert earning.net_earning == (earning.gross_amount - earning.platform_commission)
