# pyrefly: ignore-errors
# type: ignore
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

import re

# Engine setup & URL normalization
db_url = settings.DATABASE_URL.strip()

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Clean query parameter if contains sslmode for asyncpg compatibility
if "asyncpg" in db_url and "sslmode=" in db_url:
    db_url = re.sub(r'[?&]sslmode=[^&]+', '', db_url)

import ssl

connect_args = {}
if "sqlite" in db_url:
    connect_args = {"check_same_thread": False}
elif "asyncpg" in db_url:
    # Supabase & Cloud PostgreSQL require SSL encryption
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    connect_args = {"ssl": ssl_ctx}

engine = create_async_engine(
    db_url,
    echo=False,
    connect_args=connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
