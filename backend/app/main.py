from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import auth, receiver, sender


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(receiver.router)
app.include_router(sender.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "platform": "shiva"}


@app.get("/api/v1/info")
def platform_info():
    return {
        "name": "Shiva",
        "stack": ["python3", "docker", "postgresql", "node.js", "vercel", "github"],
        "environment": "production" if not settings.debug else "development",
        "features": ["auth", "database", "api_receiver", "api_sender"],
        "api_environment": settings.api_environment,
    }
