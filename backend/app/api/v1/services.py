from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.permissions import require_admin
from app.models.catalog import Service, ServiceSubcategory, ServiceCategory, ProviderService
from app.models.user import ServiceProvider, VerificationStatus, User
from app.schemas.catalog import ServiceResponse, ServiceCreateRequest

router = APIRouter(prefix="/services", tags=["Services Catalog"])


@router.get("", response_model=List[ServiceResponse])
def list_services(
    category_id: Optional[int] = None,
    subcategory_id: Optional[int] = None,
    search: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    db: Session = Depends(get_db)
):
    """Public search and filter across all master services."""
    query = db.query(Service).filter(Service.is_active == True)

    if subcategory_id:
        query = query.filter(Service.subcategory_id == subcategory_id)
    elif category_id:
        query = query.join(ServiceSubcategory).filter(ServiceSubcategory.category_id == category_id)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (Service.name.ilike(search_filter)) | (Service.description.ilike(search_filter))
        )

    if min_price is not None:
        query = query.filter(Service.base_price >= min_price)
    if max_price is not None:
        query = query.filter(Service.base_price <= max_price)

    return query.order_by(Service.name.asc()).all()


@router.get("/{id}")
def get_service_details(id: int, postal_code: Optional[str] = None, db: Session = Depends(get_db)):
    """Fetch service details along with approved providers offering this service."""
    service = db.query(Service).options(
        joinedload(Service.subcategory).joinedload(ServiceSubcategory.category)
    ).filter(Service.id == id, Service.is_active == True).first()

    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")

    # Find approved providers offering this service
    prov_query = db.query(ProviderService).join(ServiceProvider).filter(
        ProviderService.service_id == service.id,
        ProviderService.is_available == True,
        ServiceProvider.verification_status == VerificationStatus.APPROVED
    )

    provider_services = prov_query.all()
    providers_list = []
    for ps in provider_services:
        p = ps.provider
        providers_list.append({
            "provider_id": p.id,
            "business_name": p.business_name,
            "custom_price": ps.custom_price,
            "duration_min": ps.duration_min,
            "average_rating": float(p.average_rating or 0.0),
            "total_reviews": p.total_reviews,
            "experience_years": p.experience_years,
            "bio": p.bio,
            "verification_status": p.verification_status.value,
        })

    return {
        "service": {
            "id": service.id,
            "name": service.name,
            "slug": service.slug,
            "description": service.description,
            "base_price": service.base_price,
            "estimated_duration_min": service.estimated_duration_min,
            "image_url": service.image_url,
            "subcategory_id": service.subcategory_id,
            "subcategory_name": service.subcategory.name,
            "category_name": service.subcategory.category.name,
        },
        "providers": providers_list
    }


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    payload: ServiceCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Admin endpoint to create a new master service."""
    sub = db.query(ServiceSubcategory).filter(ServiceSubcategory.id == payload.subcategory_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcategory not found.")

    existing = db.query(Service).filter(Service.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service slug already exists.")

    service = Service(
        subcategory_id=payload.subcategory_id,
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        base_price=payload.base_price,
        estimated_duration_min=payload.estimated_duration_min,
        image_url=payload.image_url,
        is_active=True
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service

