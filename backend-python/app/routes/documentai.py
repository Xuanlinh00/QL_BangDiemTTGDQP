"""
Google Cloud Document AI — Form Parser route.
Endpoint: POST /documentai/process

Flow:
  1. Nhận file PDF (hoặc ảnh) từ frontend
  2. Thử Document AI Form Parser (nếu đã cấu hình)
     └─ Fallback: OCR pipeline (pdfplumber → Tesseract) nếu Document AI lỗi
  3. Parse kết quả → StudentRecord list (DSGD) hoặc entities/tables
  4. Lưu vào MongoDB
  5. Trả về dữ liệu cấu trúc cho frontend

Yêu cầu:
  - google-cloud-documentai (optional)
  - Biến môi trường: GOOGLE_CLOUD_PROJECT_ID, DOCUMENTAI_PROCESSOR_ID,
    GOOGLE_CLOUD_LOCATION (mặc định "us"),
    GOOGLE_APPLICATION_CREDENTIALS (đường dẫn JSON key)
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.config import settings
from app.database.mongodb import (
    get_document_by_id,
    list_documents,
    save_document_result,
    search_documents,
)
from app.routes.ocr import _ocr_quality_score, _run_ocr
from app.parsers.dsgd_parser import DSGDDocument, StudentRecord, parse_document

logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────────────────────────────────
# Pydantic models
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
    students: List[Dict[str, Any]] = []        # Chỉ có khi document_type = DSGD
    overall_confidence: float
    ocr_engine: str                             # "documentai" | "pdfplumber" | "tesseract"
    ocr_quality: Dict[str, Any] = {}
    mongo_saved: bool
    parse_warnings: List[str] = []
    message: str

    class Config:
        arbitrary_types_allowed = True


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
    Raise RuntimeError nếu chưa cấu hình để caller có thể fallback.
    """
    try:
        from google.cloud import documentai
        from google.api_core.client_options import ClientOptions
    except ImportError:
        raise RuntimeError("google-cloud-documentai chưa cài. Chạy: pip install google-cloud-documentai")

    if not getattr(settings, "GOOGLE_CLOUD_PROJECT_ID", None) or \
       not getattr(settings, "DOCUMENTAI_PROCESSOR_ID", None):
        raise RuntimeError("Chưa cấu hình GOOGLE_CLOUD_PROJECT_ID / DOCUMENTAI_PROCESSOR_ID")

    location = getattr(settings, "GOOGLE_CLOUD_LOCATION", "us")
    endpoint = f"{location}-documentai.googleapis.com"
    client = documentai.DocumentProcessorServiceClient(
        client_options=ClientOptions(api_endpoint=endpoint)
    )

    processor_name = client.processor_path(
        settings.GOOGLE_CLOUD_PROJECT_ID,
        location,
        settings.DOCUMENTAI_PROCESSOR_ID,
    )

    result = client.process_document(
        request=documentai.ProcessRequest(
            name=processor_name,
            raw_document=documentai.RawDocument(content=file_bytes, mime_type=mime_type),
        )
    )
    document = result.document
    full_text = document.text or ""

    # ── Entities (form fields: key-value pairs) ──
    entities: List[Dict[str, Any]] = []
    for entity in document.entities:
        name = entity.type_ or ""
        value = entity.mention_text or _get_text_from_layout(entity.page_anchor, full_text)
        confidence = float(entity.confidence) if entity.confidence else 0.0
        entities.append({"name": name, "value": value, "confidence": confidence})
        for prop in entity.properties:
            entities.append({
                "name": f"{name}.{prop.type_}" if prop.type_ else name,
                "value": prop.mention_text or "",
                "confidence": float(prop.confidence) if prop.confidence else 0.0,
            })

    # ── Tables ──
    tables: List[Dict[str, Any]] = []
    for page in document.pages:
        for table in page.tables:
            headers = [
                _get_text_from_layout(cell.layout, full_text)
                for cell in (table.header_rows[0].cells if table.header_rows else [])
            ]
            rows_data = [
                [_get_text_from_layout(cell.layout, full_text) for cell in row.cells]
                for row in table.body_rows
            ]
            tables.append({"headers": headers, "rows": rows_data})

    confidences = [e["confidence"] for e in entities if e["confidence"] > 0]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.8

    return {
        "raw_text": full_text,
        "entities": entities,
        "tables": tables,
        "confidence": avg_confidence,
        "pages": len(document.pages),
        "engine": "documentai",
    }


def _tables_from_parsed(doc: DSGDDocument) -> List[Dict[str, Any]]:
    """Chuyển DSGDDocument.students → table format tương thích DocumentAIResult."""
    if not doc.students:
        return []
    headers = [
        "STT", "MSSV", "Họ và Tên", "Ngày sinh", "Nơi sinh",
        "HP1_L1", "HP1_L2", "HP2_L1", "HP2_L2",
        "HP3_L1", "HP3_L2", "HP4_L1", "HP4_L2",
        "Điểm MH", "Xếp loại", "Kết quả",
    ]
    rows = []
    for s in doc.students:
        sc = s.scores
        rows.append([
            str(s.stt), s.mssv, s.ho_va_ten, s.ngay_sinh, s.noi_sinh,
            str(sc.hp1_l1 or ""), str(sc.hp1_l2 or ""),
            str(sc.hp2_l1 or ""), str(sc.hp2_l2 or ""),
            str(sc.hp3_l1 or ""), str(sc.hp3_l2 or ""),
            str(sc.hp4_l1 or ""), str(sc.hp4_l2 or ""),
            str(sc.diem_mon_hoc or ""), sc.xep_loai or "", sc.ket_qua or "",
        ])
    return [{"headers": headers, "rows": rows}]


def _entities_from_parsed(doc: DSGDDocument) -> List[Dict[str, Any]]:
    """Chuyển metadata DSGDDocument → entity format."""
    fields = [
        ("truong", doc.truong),
        ("don_vi", doc.don_vi),
        ("ma_lop", doc.ma_lop),
        ("mon_hoc", doc.mon_hoc),
        ("nam_hoc", doc.nam_hoc),
        ("tong_sv", str(doc.tong_sv)),
        ("sv_dat", str(doc.sv_dat)),
        ("sv_hong", str(doc.sv_hong)),
    ]
    return [
        {"name": k, "value": v, "confidence": 0.95}
        for k, v in fields if v
    ]


def _student_to_dict(s: StudentRecord) -> Dict[str, Any]:
    sc = s.scores
    return {
        "stt": s.stt,
        "mssv": s.mssv,
        "ho_va_ten": s.ho_va_ten,
        "ngay_sinh": s.ngay_sinh,
        "noi_sinh": s.noi_sinh,
        "hp1_l1": sc.hp1_l1, "hp1_l2": sc.hp1_l2,
        "hp2_l1": sc.hp2_l1, "hp2_l2": sc.hp2_l2,
        "hp3_l1": sc.hp3_l1, "hp3_l2": sc.hp3_l2,
        "hp4_l1": sc.hp4_l1, "hp4_l2": sc.hp4_l2,
        "diem_mon_hoc": sc.diem_mon_hoc,
        "xep_loai": sc.xep_loai,
        "ket_qua": sc.ket_qua,
        "confidence": s.confidence,
        "warnings": s.warnings,
    }


# ─────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────

@router.post("/process", response_model=DocumentAIResult)
async def process_document(
    file: UploadFile = File(...),
    document_type: str = Form(default="DSGD"),
    document_id: Optional[str] = Form(default=None),
    engine: str = Form(default="auto"),  # "auto" | "documentai" | "tesseract" | "vision"
):
    """
    Upload PDF/ảnh → OCR → Parse → MongoDB → trả kết quả.

    engine="auto":
      1. Thử Document AI nếu đã cấu hình
      2. Fallback pdfplumber (PDF có text nhúng)
      3. Fallback Tesseract với preprocessing nâng cao
    """
    if not document_id:
        document_id = str(uuid.uuid4())

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

    # ── Bước 1: OCR ──────────────────────────────────
    ocr_engine_used = "tesseract"
    raw_text = ""
    entities_raw: List[Dict] = []
    tables_raw: List[Dict] = []
    confidence = 0.0

    # ⚠️ SKIP Document AI (yêu cầu billing)
    # Dùng OCR pipeline: Gemini (với fallback Tesseract) thay vì Document AI
    logger.info("⏭️ Bỏ qua Document AI (yêu cầu billing), dùng Gemini + Tesseract OCR")
    
    try:
        # Xác định engine: nếu "documentai" hoặc "auto" → dùng Gemini (có fallback Tesseract)
        ocr_engine_arg = "gemini" if engine in ("auto", "documentai") else engine
        raw_text = _run_ocr(file_bytes, engine=ocr_engine_arg, document_type=document_type)
        
        # Xác định engine thực tế được sử dụng dựa trên quality score
        ocr_quality_obj = _ocr_quality_score(raw_text)
        confidence = ocr_quality_obj.get("score", 0) / 100
        
        # Nếu quality score cao → Gemini, nếu thấp → Tesseract fallback
        if confidence > 0.7:
            ocr_engine_used = "gemini"
        else:
            ocr_engine_used = "tesseract"
        
        logger.info(
            f"✅ OCR done: engine={ocr_engine_used} chars={len(raw_text)} "
            f"quality={ocr_quality_obj.get('score', 0):.1f}% confidence={confidence:.2f}"
        )
    except Exception as exc:
        logger.error(f"❌ OCR pipeline failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"OCR thất bại: {exc}")

    ocr_quality = _ocr_quality_score(raw_text)

    # ── Bước 2: Parse ─────────────────────────────────
    students_out: List[Dict[str, Any]] = []
    parse_warnings: List[str] = []

    parsed = parse_document(raw_text, document_type)

    if document_type.upper() == "DSGD" and isinstance(parsed, DSGDDocument):
        students_out = [_student_to_dict(s) for s in parsed.students]
        parse_warnings = parsed.parse_warnings

        # Nếu Document AI chưa trích được bảng → dùng bảng từ parser
        if not tables_raw:
            tables_raw = _tables_from_parsed(parsed)
        if not entities_raw:
            entities_raw = _entities_from_parsed(parsed)

        logger.info(
            f"Parsed {len(students_out)} students | "
            f"đạt={parsed.sv_dat} hỏng={parsed.sv_hong} | "
            f"{len(parse_warnings)} warnings"
        )
    elif isinstance(parsed, dict):
        # BieuMau: key-value → entities
        if not entities_raw:
            entities_raw = [
                {"name": k, "value": v, "confidence": 0.9}
                for k, v in parsed.items()
            ]

    # ── Bước 3: Lưu MongoDB ───────────────────────────
    mongo_saved = False
    try:
        summary = {}
        if document_type.upper() == "DSGD" and isinstance(parsed, DSGDDocument):
            summary = {
                "tong_sv": parsed.tong_sv,
                "sv_dat": parsed.sv_dat,
                "sv_hong": parsed.sv_hong,
                "ma_lop": parsed.ma_lop,
                "mon_hoc": parsed.mon_hoc,
            }

        await save_document_result(
            document_id=document_id,
            filename=filename,
            document_type=document_type,
            raw_text=raw_text,
            documentai_response={
                "engine": ocr_engine_used,
                "ocr_quality": ocr_quality,
                "entity_count": len(entities_raw),
                "table_count": len(tables_raw),
                "student_count": len(students_out),
                **summary,
            },
            extracted_entities=entities_raw,
            extracted_tables=tables_raw,
            confidence=confidence,
        )
        mongo_saved = True
        logger.info(f"Saved to MongoDB: doc_id={document_id}")
    except Exception as exc:
        logger.error(f"MongoDB save error: {exc}", exc_info=True)

    # ── Bước 4: Response ──────────────────────────────
    return DocumentAIResult(
        document_id=document_id,
        filename=filename,
        document_type=document_type,
        raw_text=raw_text,
        entities=[EntityField(**e) for e in entities_raw],
        tables=[
            TableData(headers=t["headers"], rows=[TableRow(cells=r) for r in t["rows"]])
            for t in tables_raw
        ],
        students=students_out,
        overall_confidence=confidence,
        ocr_engine=ocr_engine_used,
        ocr_quality=ocr_quality,
        mongo_saved=mongo_saved,
        parse_warnings=parse_warnings,
        message=(
            f"Xử lý thành công ({ocr_engine_used}): "
            f"{len(students_out)} sinh viên" if students_out
            else f"Xử lý thành công ({ocr_engine_used})"
        ),
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