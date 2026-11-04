from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.permissions import require_customer, require_provider
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.feedback import Review, ReviewResponse
from app.schemas.feedback import ReviewCreateRequest, ReviewResponse as ReviewSchema, ReviewReplyRequest

router = APIRouter(prefix="/reviews", tags=["Reviews & Ratings"])


@router.post("", response_model=ReviewSchema, status_code=status.HTTP_201_CREATED)
def submit_review(
    payload: ReviewCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """Verified customer submits rating & review for completed booking."""
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only review your own booking.")

    # Rule: Only COMPLETED bookings can be reviewed
    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Reviews can only be submitted for completed services.")

    # Rule: Prevent duplicate review for same booking
    existing = db.query(Review).filter(Review.booking_id == booking.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted a review for this booking.")

    review = Review(
        booking_id=booking.id,
        customer_id=booking.customer_id,
        provider_id=booking.provider_id,
        rating=payload.rating,
        comment=payload.comment,
        is_verified=True,
        is_visible=True,
    )
    db.add(review)
    db.flush()

    # Recalculate provider average rating
    all_reviews = db.query(Review).filter(Review.provider_id == booking.provider_id).all()
    avg_rating = sum(r.rating for r in all_reviews) / len(all_reviews)
    booking.provider.average_rating = Decimal(f"{avg_rating:.2f}")
    booking.provider.total_reviews = len(all_reviews)

    db.commit()
    db.refresh(review)

    return ReviewSchema(
        id=review.id,
        booking_id=review.booking_id,
        customer_name=f"{current_user.first_name} {current_user.last_name}",
        rating=review.rating,
        comment=review.comment,
        reply=None,
        created_at=review.created_at,
    )


@router.get("/provider/{provider_id}", response_model=List[ReviewSchema])
def get_provider_reviews(provider_id: int, db: Session = Depends(get_db)):
    """Public list of verified customer reviews for a service provider."""
    reviews = db.query(Review).options(
        joinedload(Review.customer).joinedload(Review.customer.property.mapper.class_.user),
        joinedload(Review.response)
    ).filter(
        Review.provider_id == provider_id,
        Review.is_visible == True
    ).order_by(Review.created_at.desc()).all()

    result = []
    for r in reviews:
        cust_name = f"{r.customer.user.first_name} {r.customer.user.last_name[0]}." if r.customer and r.customer.user else "Verified Customer"
        reply_txt = r.response.response_text if r.response else None
        result.append(ReviewSchema(
            id=r.id,
            booking_id=r.booking_id,
            customer_name=cust_name,
            rating=r.rating,
            comment=r.comment,
            reply=reply_txt,
            created_at=r.created_at,
        ))
    return result


@router.post("/{id}/respond")
def respond_to_review(
    id: int,
    payload: ReviewReplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider)
):
    """Provider public response to customer feedback."""
    provider = current_user.provider_profile
    review = db.query(Review).filter(Review.id == id, Review.provider_id == provider.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")

    if review.response:
        review.response.response_text = payload.response_text
    else:
        resp = ReviewResponse(
            review_id=review.id,
            provider_id=provider.id,
            response_text=payload.response_text
        )
        db.add(resp)

    db.commit()
    return {"message": "Response submitted successfully."}

