from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel, Field


class ServiceSubcategoryResponse(BaseModel):
    id: int
    category_id: int
    name: str
    slug: str
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class ServiceResponse(BaseModel):
    id: int
    subcategory_id: int
    name: str
    slug: str
    description: Optional[str] = None
    base_price: Decimal
    estimated_duration_min: int
    image_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class ServiceCategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool
    sort_order: int
    subcategories: List[ServiceSubcategoryResponse] = []

    class Config:
        from_attributes = True


class CategoryCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = None
    icon: Optional[str] = "Sparkles"
    image_url: Optional[str] = None
    sort_order: int = 0


class SubcategoryCreateRequest(BaseModel):
    category_id: int
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = None


class ServiceCreateRequest(BaseModel):
    subcategory_id: int
    name: str = Field(..., min_length=2, max_length=200)
    slug: str = Field(..., min_length=2, max_length=220)
    description: Optional[str] = None
    base_price: Decimal = Field(..., gt=0)
    estimated_duration_min: int = Field(default=60, gt=0)
    image_url: Optional[str] = None


class ProviderServiceResponse(BaseModel):
    id: int
    service_id: int
    service_name: str
    category_name: str
    custom_price: Decimal
    duration_min: int
    is_available: bool
    description: Optional[str] = None

    class Config:
        from_attributes = True


class ProviderServiceUpsertRequest(BaseModel):
    service_id: int
    custom_price: Decimal = Field(..., gt=0)
    duration_min: int = Field(default=60, gt=0)
    is_available: bool = True
    description: Optional[str] = None

