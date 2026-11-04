import os
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "HomeServe Technologies"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str = "super-secret-development-key-change-in-production-min-32-chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "sqlite:///./homeserve.db"

    # Bootstrap Admin
    FIRST_SUPERADMIN_EMAIL: str = "admin@homeserve.com"
    FIRST_SUPERADMIN_PASSWORD: str = "AdminPassword123!"
    FIRST_SUPERADMIN_FIRSTNAME: str = "Platform"
    FIRST_SUPERADMIN_LASTNAME: str = "Admin"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # Razorpay
    RAZORPAY_KEY_ID: str = "rzp_test_demo123"
    RAZORPAY_KEY_SECRET: str = "secret_demo123"
    PAYMENT_SIMULATION_ENABLED: bool = True

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = "demo"
    CLOUDINARY_API_KEY: str = "123456789"
    CLOUDINARY_API_SECRET: str = "secret"

    # Email
    SMTP_HOST: str = "smtp.mailtrap.io"
    SMTP_PORT: int = 2525
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "support@homeserve.local"
    EMAILS_ENABLED: bool = False

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()

