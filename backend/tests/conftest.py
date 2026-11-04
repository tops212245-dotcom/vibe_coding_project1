import pytest
import secrets
from datetime import date, time, timedelta, datetime, timezone
from decimal import Decimal
from app.core.database import SessionLocal, Base, engine
from app.seed import seed_database
from app.models.user import User, Customer, ServiceProvider, Technician, Address, UserRole
from app.models.catalog import Service
from app.models.booking import Booking, BookingStatus

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
    yield

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def admin_user(db):
    return db.query(User).filter(User.role == UserRole.ADMIN).first()

@pytest.fixture
def provider_user(db):
    return db.query(User).filter(User.role == UserRole.PROVIDER).first()

@pytest.fixture
def customer_user(db):
    return db.query(User).filter(User.role == UserRole.CUSTOMER).first()

@pytest.fixture
def technician_user(db):
    return db.query(User).filter(User.role == UserRole.TECHNICIAN).first()

@pytest.fixture
def completed_booking(db, customer_user, provider_user):
    customer = customer_user.customer_profile
    provider = provider_user.provider_profile
    address = db.query(Address).filter(Address.user_id == customer_user.id).first()
    service = db.query(Service).first()

    booking = Booking(
        booking_reference=f"HS-TEST-{secrets.token_hex(4).upper()}",
        customer_id=customer.id,
        provider_id=provider.id,
        service_id=service.id,
        address_id=address.id,
        booking_date=date.today(),
        booking_time=time(14, 0),
        estimated_duration_min=service.estimated_duration_min,
        problem_description="Test problem description",
        subtotal=Decimal("499.00"),
        discount=Decimal("0.00"),
        tax=Decimal("89.82"),
        total_amount=Decimal("588.82"),
        status=BookingStatus.COMPLETED
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking
