"""
MongoDB client và các hàm truy cập database cho Document AI.
Sử dụng Motor (async driver) cho FastAPI.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import DESCENDING, IndexModel

from app.config import settings

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────
# Client singleton
# ─────────────────────────────────────────────────────
_client: Optional[AsyncIOMotorClient] = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URL)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[settings.MONGODB_DB_NAME]


async def close_connection():
    global _client
    if _client:
        _client.close()
        _client = None


# ─────────────────────────────────────────────────────
# Collection names
# ─────────────────────────────────────────────────────
COLLECTION_DOCUMENTS = "documents"       # kết quả OCR / Document AI đầy đủ
COLLECTION_EXTRACTIONS = "extractions"   # dữ liệu cấu trúc đã trích xuất


# ─────────────────────────────────────────────────────
# Khởi tạo indexes
# ─────────────────────────────────────────────────────
async def create_indexes():
    db = get_db()
    try:
        await db[COLLECTION_DOCUMENTS].create_indexes([
            IndexModel([("document_id", DESCENDING)], unique=True),
            IndexModel([("uploaded_at", DESCENDING)]),
            IndexModel([("document_type", DESCENDING)]),
            IndexModel([("status", DESCENDING)]),
        ])
        await db[COLLECTION_EXTRACTIONS].create_indexes([
            IndexModel([("document_id", DESCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ])
        logger.info("MongoDB indexes created successfully")
    except Exception as exc:
        logger.warning(f"Index creation warning (may already exist): {exc}")


# ─────────────────────────────────────────────────────
# CRUD - Documents
# ─────────────────────────────────────────────────────
async def save_document_result(
    document_id: str,
    filename: str,
    document_type: str,
    raw_text: str,
    documentai_response: Dict[str, Any],
    extracted_entities: List[Dict[str, Any]],
    extracted_tables: List[Dict[str, Any]],
    confidence: float = 0.0,
    status: str = "completed",
) -> str:
    """Lưu kết quả Document AI vào MongoDB. Trả về MongoDB _id dạng string."""
    db = get_db()
    doc = {
        "document_id": document_id,
        "filename": filename,
        "document_type": document_type,
        "raw_text": raw_text,
        "documentai_response": documentai_response,
        "extracted_entities": extracted_entities,
        "extracted_tables": extracted_tables,
        "confidence": confidence,
        "status": status,
        "uploaded_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db[COLLECTION_DOCUMENTS].replace_one(
        {"document_id": document_id},
        doc,
        upsert=True,
    )
    logger.info(f"Saved document {document_id} to MongoDB")
    return document_id


async def get_document_by_id(document_id: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    doc = await db[COLLECTION_DOCUMENTS].find_one(
        {"document_id": document_id},
        {"_id": 0},
    )
    return doc


async def list_documents(
    document_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    db = get_db()
    query: Dict[str, Any] = {}
    if document_type:
        query["document_type"] = document_type
    cursor = db[COLLECTION_DOCUMENTS].find(
        query,
        {"_id": 0, "documentai_response": 0, "raw_text": 0},  # loại trường nặng
    ).sort("uploaded_at", DESCENDING).skip(skip).limit(limit)
    return await cursor.to_list(length=limit)


async def search_documents(keyword: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Full-text search trong raw_text."""
    db = get_db()
    cursor = db[COLLECTION_DOCUMENTS].find(
        {"raw_text": {"$regex": keyword, "$options": "i"}},
        {"_id": 0, "documentai_response": 0},
    ).limit(limit)
    return await cursor.to_list(length=limit)
