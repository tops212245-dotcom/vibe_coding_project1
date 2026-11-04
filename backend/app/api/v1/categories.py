from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.permissions import require_admin
from app.models.catalog import ServiceCategory, ServiceSubcategory, Service
from app.models.user import User
from app.schemas.catalog import (
    ServiceCategoryResponse, CategoryCreateRequest,
    SubcategoryCreateRequest, ServiceSubcategoryResponse
)

router = APIRouter(prefix="/categories", tags=["Service Categories"])


@router.get("", response_model=List[ServiceCategoryResponse])
def list_categories(
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """Public discovery of all service categories and subcategories."""
    query = db.query(ServiceCategory).options(
        joinedload(ServiceCategory.subcategories)
    )
    if not include_inactive:
        query = query.filter(ServiceCategory.is_active == True)
    categories = query.order_by(ServiceCategory.sort_order.asc()).all()
    return categories


@router.get("/{slug}", response_model=ServiceCategoryResponse)
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    """Fetch single category details with its active subcategories."""
    category = db.query(ServiceCategory).options(
        joinedload(ServiceCategory.subcategories)
    ).filter(ServiceCategory.slug == slug, ServiceCategory.is_active == True).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    return category


@router.post("", response_model=ServiceCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Admin endpoint to create a new category dynamically."""
    existing = db.query(ServiceCategory).filter(
        (ServiceCategory.slug == payload.slug) | (ServiceCategory.name == payload.name)
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name or slug already exists.")

    category = ServiceCategory(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        icon=payload.icon,
        image_url=payload.image_url,
        sort_order=payload.sort_order,
        is_active=True
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.post("/subcategories", response_model=ServiceSubcategoryResponse, status_code=status.HTTP_201_CREATED)
def create_subcategory(
    payload: SubcategoryCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Admin endpoint to add a subcategory to an existing category."""
    cat = db.query(ServiceCategory).filter(ServiceCategory.id == payload.category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    sub = ServiceSubcategory(
        category_id=payload.category_id,
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        is_active=True
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

