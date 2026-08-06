import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import analytics, auth, dashboard, datasets
from app.services import ensure_upload_dir

Base.metadata.create_all(bind=engine)
ensure_upload_dir()

app = FastAPI(title="DataBoard API", version="1.0.0")

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(datasets.router)
app.include_router(analytics.router)
app.include_router(dashboard.router)


@app.get("/health")
def health():
    return {"status": "ok"}
