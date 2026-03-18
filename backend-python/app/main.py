"""FastAPI application entry point."""

import logging
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.mongodb import close_connection, create_indexes
from app.routes import documentai, export, extract, ocr, ocr_advanced, reconcile

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize app
app = FastAPI(
    title="TVU GDQP-AN Worker API",
    description="OCR and data extraction worker service",
    version="1.0.0",
)

# CORS middleware
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(ocr.router, prefix="/ocr", tags=["OCR"])
app.include_router(extract.router, prefix="/extract", tags=["Extract"])
app.include_router(reconcile.router, prefix="/reconcile", tags=["Reconcile"])
app.include_router(documentai.router, prefix="/documentai", tags=["Document AI"])
app.include_router(export.router, prefix="/export", tags=["Export"])
app.include_router(ocr_advanced.router, prefix="/ocr-advanced", tags=["OCR Advanced"])


@app.get("/health")
async def health() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event() -> None:
    """Startup event handler."""
    logger.info("TVU GDQP-AN Worker API started")
    await create_indexes()


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Shutdown event handler."""
    await close_connection()
    logger.info("MongoDB connection closed")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.API_HOST, port=settings.API_PORT)