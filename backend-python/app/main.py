from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import settings
from app.routes import ocr, extract, reconcile
from app.routes import documentai
from app.database.mongodb import create_indexes, close_connection

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TVU GDQP-AN Worker API",
    description="OCR and data extraction worker service",
    version="1.0.0"
)

# CORS middleware
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(ocr.router, prefix="/ocr", tags=["OCR"])
app.include_router(extract.router, prefix="/extract", tags=["Extract"])
app.include_router(reconcile.router, prefix="/reconcile", tags=["Reconcile"])
app.include_router(documentai.router, prefix="/documentai", tags=["Document AI"])

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.on_event("startup")
async def startup_event():
    logger.info("TVU GDQP-AN Worker API started")
    await create_indexes()

@app.on_event("shutdown")
async def shutdown_event():
    await close_connection()
    logger.info("MongoDB connection closed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
