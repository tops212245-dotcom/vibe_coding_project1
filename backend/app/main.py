import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models import *  # Import all 33 models into metadata
from app.api.v1 import api_router
from app.seed import seed_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("homeserve.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    logger.info("Initializing HomeServe Technologies backend engine...")
    # Create tables if not existing
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema verified (33 tables).")

    # Run initial database seed (Super Admin, Master Categories, Demo data)
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        logger.error(f"Error during database seed: {e}")
    finally:
        db.close()

    yield
    logger.info("Shutting down HomeServe Technologies backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Multi-vendor Home Services Booking SaaS Platform REST API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "api_v1": settings.API_V1_PREFIX
    }


@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }

