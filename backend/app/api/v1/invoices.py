from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_active_user
from app.models.user import User, UserRole
from app.models.booking import Booking
from app.models.finance import Invoice
from app.schemas.finance import InvoiceResponse

router = APIRouter(prefix="/invoices", tags=["Invoices & Billing"])


@router.get("/booking/{booking_id}", response_model=InvoiceResponse)
def get_invoice_by_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve invoice details for a specific booking."""
    invoice = db.query(Invoice).filter(Invoice.booking_id == booking_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice has not been issued for this booking yet.")

    booking = invoice.booking
    is_admin = current_user.role == UserRole.ADMIN
    is_cust = booking.customer.user_id == current_user.id
    is_prov = booking.provider.user_id == current_user.id

    if not (is_admin or is_cust or is_prov):
        raise HTTPException(status_code=403, detail="Unauthorized to view this invoice.")

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


@router.get("/{id}/html", response_class=HTMLResponse)
def download_invoice_html(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Render a printable tax invoice HTML document."""
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    booking = invoice.booking
    is_admin = current_user.role == UserRole.ADMIN
    is_cust = booking.customer.user_id == current_user.id
    is_prov = booking.provider.user_id == current_user.id

    if not (is_admin or is_cust or is_prov):
        raise HTTPException(status_code=403, detail="Unauthorized.")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Tax Invoice - {invoice.invoice_number}</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #1e293b; }}
            .invoice-card {{ max-width: 800px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }}
            .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }}
            .brand {{ font-size: 24px; font-weight: bold; color: #1e3a8a; }}
            .badge {{ background: #ecfdf5; color: #047857; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600; display: inline-block; }}
            .details-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th {{ background: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 14px; }}
            td {{ padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }}
            .totals {{ margin-top: 20px; text-align: right; }}
            .totals-row {{ margin: 6px 0; font-size: 14px; }}
            .grand-total {{ font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 10px; border-top: 2px solid #e2e8f0; padding-top: 10px; }}
            .footer {{ margin-top: 40px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 20px; }}
            @media print {{ body {{ margin: 0; }} .invoice-card {{ box-shadow: none; border: none; }} }}
        </style>
    </head>
    <body>
        <div class="invoice-card">
            <div class="header">
                <div>
                    <div class="brand">HomeServe Technologies</div>
                    <div style="color: #64748b; font-size: 13px; margin-top: 4px;">Certified On-Demand Home Services Platform</div>
                </div>
                <div style="text-align: right;">
                    <div class="badge">PAID</div>
                    <div style="font-size: 18px; font-weight: bold; margin-top: 8px;">{invoice.invoice_number}</div>
                    <div style="color: #64748b; font-size: 12px;">Date: {invoice.issued_at.strftime('%d %B %Y')}</div>
                </div>
            </div>

            <div class="details-grid">
                <div>
                    <strong style="color: #475569; font-size: 12px; text-transform: uppercase;">Billed To:</strong>
                    <div style="font-weight: 600; margin-top: 4px;">{invoice.customer_name}</div>
                    <div style="color: #64748b; font-size: 13px;">Customer ID: #{booking.customer_id}</div>
                </div>
                <div>
                    <strong style="color: #475569; font-size: 12px; text-transform: uppercase;">Service Partner:</strong>
                    <div style="font-weight: 600; margin-top: 4px;">{invoice.provider_business_name}</div>
                    <div style="color: #64748b; font-size: 13px;">Booking Ref: {booking.booking_reference}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Duration</th>
                        <th style="text-align: right;">Amount (INR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>{invoice.service_name}</strong>
                            <div style="color: #64748b; font-size: 12px;">Fulfilled on {booking.booking_date.strftime('%d %b %Y')} at {booking.booking_time.strftime('%H:%M')}</div>
                        </td>
                        <td>{booking.estimated_duration_min} mins</td>
                        <td style="text-align: right;">₹{invoice.subtotal:.2f}</td>
                    </tr>
                </tbody>
            </table>

            <div class="totals">
                <div class="totals-row">Subtotal: ₹{invoice.subtotal:.2f}</div>
                <div class="totals-row" style="color: #16a34a;">Discount Applied: -₹{invoice.discount_amount:.2f}</div>
                <div class="totals-row">Taxes (GST 5%): ₹{invoice.tax_amount:.2f}</div>
                <div class="grand-total">Total Paid: ₹{invoice.total_paid:.2f}</div>
            </div>

            <div class="footer">
                This is an electronically generated valid tax invoice. All home services backed by HomeServe 30-Day Satisfaction Guarantee.
                <br>Support: support@homeserve.local | CIN: U72200MH2026PTC89210
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html)

