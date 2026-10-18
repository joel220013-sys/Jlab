# pyrefly: ignore-errors
# type: ignore
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.seeds.seed_data import seed_initial_data

from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.patients import router as patients_router
from app.api.v1.tests import router as tests_router
from app.api.v1.orders import router as orders_router
from app.api.v1.results import router as results_router
from app.api.v1.approvals import router as approvals_router
from app.api.v1.reports import router as reports_router
from app.api.v1.billing import router as billing_router
from app.api.v1.communication import router as communication_router
from app.api.v1.admin import router as admin_router
from app.api.v1.settings import router as settings_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist without blocking or crashing on remote poolers
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            has_tables = False
            try:
                res = await conn.execute(text("SELECT count(*) FROM users LIMIT 1"))
                has_tables = True
            except Exception:
                has_tables = False

            if not has_tables:
                print("First-time setup: Initializing database schema...")
                await conn.run_sync(Base.metadata.create_all)
                async with AsyncSessionLocal() as session:
                    await seed_initial_data(session)
                print("Database schema and seeds initialized successfully.")
            else:
                print("Database connection verified. Schema is up to date.")
    except Exception as e:
        print(f"Notice: Database startup check notice: {e}. Server continuing.")

    yield
    # Shutdown
    await engine.dispose()

# Turn off swagger / openapi docs in production unless DEBUG is explicitly enabled
docs_url = "/docs" if settings.DEBUG or settings.ENVIRONMENT == "development" else None
redoc_url = "/redoc" if settings.DEBUG or settings.ENVIRONMENT == "development" else None
openapi_url = "/openapi.json" if settings.DEBUG or settings.ENVIRONMENT == "development" else None

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Modern SaaS Diagnostic Laboratory Management System",
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
    lifespan=lifespan
)

# 1. Production Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# 2. Strict CORS Configuration (Only allowed domains & Vercel deployment domains)
cors_origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$" if settings.ENVIRONMENT != "development" else r"https?://.*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With", "X-Master-Token"],
)

# 3. Include API v1 routes
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)
app.include_router(patients_router, prefix=api_prefix)
app.include_router(tests_router, prefix=api_prefix)
app.include_router(orders_router, prefix=api_prefix)
app.include_router(results_router, prefix=api_prefix)
app.include_router(approvals_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)
app.include_router(billing_router, prefix=api_prefix)
app.include_router(communication_router, prefix=api_prefix)
app.include_router(admin_router, prefix=api_prefix)
app.include_router(settings_router, prefix=api_prefix)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }
