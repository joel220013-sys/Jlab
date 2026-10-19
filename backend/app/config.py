# pyrefly: ignore-errors
# type: ignore
from pydantic_settings import BaseSettings
from typing import List, Union
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "PULSE LAB"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Debugging Mode
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development") # "development" | "production"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    # Cryptographic Secret Key (Used for JWT Tokens & Session Signing)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "pulselab-super-secret-development-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Master Platform Administrator PIN (Supports 7899 / 7899514777 or env override)
    MASTER_ADMIN_PIN: str = os.getenv("MASTER_ADMIN_PIN", "7899514777")
    
    # Defaults to SQLite async for immediate out-of-the-box local execution, easily overridden with Postgres
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./pulselab.db"
    )
    
    # Whitelisted CORS Origins
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()

# Parse CORS origins if passed as comma-separated string in env
if isinstance(settings.CORS_ORIGINS, str):
    settings.CORS_ORIGINS = [orig.strip() for orig in settings.CORS_ORIGINS.split(",") if orig.strip()]

# Defensive runtime guard: ensure production never runs on static development secret
if settings.ENVIRONMENT == "production" and (not settings.SECRET_KEY or settings.SECRET_KEY == "pulselab-super-secret-development-key-2026"):
    import warnings
    import secrets
    warnings.warn("[SECURITY ALERT] Production environment detected with default SECRET_KEY! Generating ephemeral cryptographically secure key.")
    settings.SECRET_KEY = secrets.token_hex(32)



