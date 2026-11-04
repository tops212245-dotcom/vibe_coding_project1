from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.categories import router as categories_router
from app.api.v1.services import router as services_router
from app.api.v1.customers import router as customers_router
from app.api.v1.providers import router as providers_router
from app.api.v1.bookings import router as bookings_router
from app.api.v1.technicians import router as technicians_router
from app.api.v1.payments import router as payments_router
from app.api.v1.invoices import router as invoices_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(categories_router)
api_router.include_router(services_router)
api_router.include_router(customers_router)
api_router.include_router(providers_router)
api_router.include_router(bookings_router)
api_router.include_router(technicians_router)
api_router.include_router(payments_router)
api_router.include_router(invoices_router)
api_router.include_router(reviews_router)
api_router.include_router(complaints_router)
api_router.include_router(notifications_router)
api_router.include_router(analytics_router)
api_router.include_router(admin_router)

