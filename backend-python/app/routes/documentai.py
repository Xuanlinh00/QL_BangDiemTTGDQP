"""
Google Cloud Document AI — Form Parser route.
Endpoint: POST /documentai/process

Flow:
  1. Nhận file PDF (hoặc ảnh) từ frontend
  2. Gọi Document AI Form Parser để OCR + trích xuất cấu trúc
  3. Parse kết quả → entities, tables, raw_text
  4. Lưu vào MongoDB
  5. Trả về dữ liệu cấu trúc cho frontend

Yêu cầu cài đặt:
  - google-cloud-documentai
  - Biến môi trường: GOOGLE_CLOUD_PROJECT_ID, DOCUMENTAI_PROCESSOR_ID,
    GOOGLE_CLOUD_LOCATION (mặc định "us"),
    GOOGLE_APPLICATION_CREDENTIALS (đường dẫn JSON key)
"""

from __future__ import annotations

import base64
import logging
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.config import settings
from app.database.mongodb import save_document_result, get_document_by_id, list_documents, search_documents

logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────────────────────────────────
# Pydantic responses
# ─────────────────────────────────────────────────────
class EntityField(BaseModel):
    name: str
    value: str
    confidence: float


class TableRow(BaseModel):
    cells: List[str]


class TableData(BaseModel):
    headers: List[str]
    rows: List[TableRow]


class DocumentAIResult(BaseModel):
    document_id: str
    filename: str
    document_type: str
    raw_text: str
    entities: List[EntityField]
    tables: List[TableData]
    overall_confidence: float
    mongo_saved: bool
    message: str


# ─────────────────────────────────────────────────────
# Document AI helper
# ─────────────────────────────────────────────────────
def _get_text_from_layout(layout, full_text: str) -> str:
    """Trích text từ TextSegment của Document AI."""
    text = ""
    if not layout or not layout.text_anchor:
        return text
    for segment in layout.text_anchor.text_segments:
        start = int(segment.start_index) if segment.start_index else 0
        end = int(segment.end_index) if segment.end_index else 0
        text += full_text[start:end]
    return text.strip()


def _process_with_documentai(file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
    """
    Gọi Document AI Form Parser API.
    Trả về dict chứa raw_text, entities, tables, confidence.
    """
    try:
        from google.cloud import documentai
        from google.api_core.client_options import ClientOptions
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="google-cloud-documentai chưa được cài đặt. Chạy: pip install google-cloud-documentai"
        )

    if not settings.GOOGLE_CLOUD_PROJECT_ID or not settings.DOCUMENTAI_PROCESSOR_ID:
        raise HTTPException(
            status_code=500,
            detail=(
                "Thiếu cấu hình Document AI. "
                "Cần đặt GOOGLE_CLOUD_PROJECT_ID và DOCUMENTAI_PROCESSOR_ID trong file .env"
            ),
        )

    endpoint = f"{settings.GOOGLE_CLOUD_LOCATION}-documentai.googleapis.com"
    client_options = ClientOptions(api_endpoint=endpoint)
    client = documentai.DocumentProcessorServiceClient(client_options=client_options)

    processor_name = client.processor_path(
        settings.GOOGLE_CLOUD_PROJECT_ID,
        settings.GOOGLE_CLOUD_LOCATION,
        settings.DOCUMENTAI_PROCESSOR_ID,
    )

    raw_document = documentai.RawDocument(content=file_bytes, mime_type=mime_type)
    request = documentai.ProcessRequest(name=processor_name, raw_document=raw_document)

    result = client.process_document(request=request)
    document = result.document
    full_text = document.text or ""

    # ── Entities (form fields: key-value pairs) ──
    entities: List[Dict[str, Any]] = []
    for entity in document.entities:
        name = entity.type_ or ""
        value = entity.mention_text or _get_text_from_layout(entity.page_anchor, full_text)
        confidence = float(entity.confidence) if entity.confidence else 0.0
        entities.append({"name": name, "value": value, "confidence": confidence})

        # Sub-entities (nested fields)
        for prop in entity.properties:
            sub_name = f"{name}.{prop.type_}" if prop.type_ else name
            sub_value = prop.mention_text or ""
            sub_conf = float(prop.confidence) if prop.confidence else 0.0
            entities.append({"name": sub_name, "value": sub_value, "confidence": sub_conf})

    # ── Tables ──
    tables: List[Dict[str, Any]] = []
    for page in document.pages:
        for table in page.tables:
            headers: List[str] = []
            rows_data: List[List[str]] = []

            # Header row
            if table.header_rows:
                for cell in table.header_rows[0].cells:
                    headers.append(_get_text_from_layout(cell.layout, full_text))

            # Body rows
            for body_row in table.body_rows:
                row_cells = [
                    _get_text_from_layout(cell.layout, full_text)
                    for cell in body_row.cells
                ]
                rows_data.append(row_cells)

            tables.append({"headers": headers, "rows": rows_data})

    # ── Confidence trung bình ──
    confidences = [e["confidence"] for e in entities if e["confidence"] > 0]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.8

    return {
        "raw_text": full_text,
        "entities": entities,
        "tables": tables,
        "confidence": avg_confidence,
        "pages": len(document.pages),
    }


# ─────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────

@router.post("/process", response_model=DocumentAIResult)
async def process_document(
    file: UploadFile = File(...),
    document_type: str = Form(default="DSGD"),
    document_id: Optional[str] = Form(default=None),
):
    """
    Upload PDF/ảnh → Document AI Form Parser → lưu MongoDB → trả kết quả.
    """
    if not document_id:
        document_id = str(uuid.uuid4())

    # Xác định MIME type
    filename = file.filename or "document"
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    mime_map = {
        "pdf": "application/pdf",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "tif": "image/tiff",
        "tiff": "image/tiff",
    }
    mime_type = mime_map.get(ext, "application/pdf")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="File rỗng")

    # Gọi Document AI
    try:
        result = _process_with_documentai(file_bytes, mime_type)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Document AI error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Lỗi Document AI: {str(exc)}")

    # Lưu MongoDB
    mongo_saved = False
    try:
        await save_document_result(
            document_id=document_id,
            filename=filename,
            document_type=document_type,
            raw_text=result["raw_text"],
            documentai_response={
                "pages": result["pages"],
                "entity_count": len(result["entities"]),
                "table_count": len(result["tables"]),
            },
            extracted_entities=result["entities"],
            extracted_tables=result["tables"],
            confidence=result["confidence"],
        )
        mongo_saved = True
    except Exception as exc:
        logger.error(f"MongoDB save error: {exc}", exc_info=True)

    # Chuẩn bị response
    entities_out = [
        EntityField(
            name=e["name"],
            value=e["value"],
            confidence=e["confidence"],
        )
        for e in result["entities"]
    ]

    tables_out = [
        TableData(
            headers=t["headers"],
            rows=[TableRow(cells=r) for r in t["rows"]],
        )
        for t in result["tables"]
    ]

    return DocumentAIResult(
        document_id=document_id,
        filename=filename,
        document_type=document_type,
        raw_text=result["raw_text"],
        entities=entities_out,
        tables=tables_out,
        overall_confidence=result["confidence"],
        mongo_saved=mongo_saved,
        message="Xử lý thành công",
    )


@router.get("/document/{document_id}")
async def get_document(document_id: str):
    """Lấy kết quả đã lưu từ MongoDB theo document_id."""
    doc = await get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy document")
    return doc


@router.get("/documents")
async def list_all_documents(
    document_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Danh sách tất cả documents đã xử lý (từ MongoDB)."""
    docs = await list_documents(document_type=document_type, skip=skip, limit=limit)
    return {"total": len(docs), "documents": docs}


@router.get("/search")
async def search(keyword: str, limit: int = 20):
    """Tìm kiếm full-text trong các documents đã OCR."""
    docs = await search_documents(keyword=keyword, limit=limit)
    return {"keyword": keyword, "total": len(docs), "documents": docs}
