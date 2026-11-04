import csv
import io
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_admin
from app.models.user import User, Customer, ServiceProvider, Technician, UserRole, VerificationStatus
from app.models.booking import Booking, BookingStatus
from app.models.finance import ProviderEarning, Payment, PaymentStatus
from app.schemas.feedback import AdminAnalyticsResponse

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])


@router.get("/admin", response_model=AdminAnalyticsResponse)
def get_admin_analytics(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Aggregate real-time SaaS KPI metrics from database."""
    total_customers = db.query(Customer).count()
    total_providers = db.query(ServiceProvider).count()
    approved_providers = db.query(ServiceProvider).filter(ServiceProvider.verification_status == VerificationStatus.APPROVED).count()
    pending_providers = db.query(ServiceProvider).filter(ServiceProvider.verification_status == VerificationStatus.PENDING).count()
    total_technicians = db.query(Technician).count()

    total_bookings = db.query(Booking).count()
    pending_bookings = db.query(Booking).filter(Booking.status == BookingStatus.PENDING).count()
    completed_bookings = db.query(Booking).filter(Booking.status == BookingStatus.COMPLETED).count()
    cancelled_bookings = db.query(Booking).filter(Booking.status.in_([BookingStatus.CANCELLED, BookingStatus.REJECTED])).count()

    # Calculate real financials from completed bookings
    earnings = db.query(ProviderEarning).all()
    total_revenue = sum((e.gross_amount for e in earnings), Decimal("0.00"))
    total_commission = sum((e.platform_commission for e in earnings), Decimal("0.00"))
    total_provider_earnings = sum((e.net_earning for e in earnings), Decimal("0.00"))

    return AdminAnalyticsResponse(
        total_customers=total_customers,
        total_providers=total_providers,
        approved_providers=approved_providers,
        pending_providers=pending_providers,
        total_technicians=total_technicians,
        total_bookings=total_bookings,
        pending_bookings=pending_bookings,
        completed_bookings=completed_bookings,
        cancelled_bookings=cancelled_bookings,
        total_revenue=total_revenue,
        total_commission=total_commission,
        total_provider_earnings=total_provider_earnings,
    )


@router.get("/reports/csv")
def export_bookings_csv(
    report_type: str = "bookings",
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Export operational and financial records as CSV."""
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "bookings":
        writer.writerow([
            "Booking Reference", "Date", "Time", "Customer", "Provider",
            "Service", "Status", "Total Amount (INR)", "Created At"
        ])
        bookings = db.query(Booking).all()
        for b in bookings:
            cust_name = f"{b.customer.user.first_name} {b.customer.user.last_name}" if b.customer and b.customer.user else "N/A"
            writer.writerow([
                b.booking_reference,
                b.booking_date.isoformat(),
                b.booking_time.strftime("%H:%M"),
                cust_name,
                b.provider.business_name if b.provider else "N/A",
                b.service.name if b.service else "N/A",
                b.status.value,
                f"{b.total_amount:.2f}",
                b.created_at.strftime("%Y-%m-%d %H:%M:%S") if b.created_at else ""
            ])
        filename = "homeserve_bookings_report.csv"
    else:
        writer.writerow([
            "Provider Business", "Booking Ref", "Gross (INR)",
            "Commission (INR)", "Net Earning (INR)", "Paid Out", "Date"
        ])
        earnings = db.query(ProviderEarning).all()
        for e in earnings:
            writer.writerow([
                e.provider.business_name if e.provider else "N/A",
                e.booking.booking_reference if e.booking else "N/A",
                f"{e.gross_amount:.2f}",
                f"{e.platform_commission:.2f}",
                f"{e.net_earning:.2f}",
                "Yes" if e.is_paid_out else "No",
                e.created_at.strftime("%Y-%m-%d") if e.created_at else ""
            ])
        filename = "homeserve_revenue_report.csv"

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

