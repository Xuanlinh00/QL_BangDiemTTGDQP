"""
OCR Service — Tesseract (local) + Google Cloud Vision API (cloud fallback).
Supports Vietnamese scanned PDFs for academic documents:
  - DSGD  : Danh sách điểm / bảng điểm sinh viên
  - QD    : Quyết định tốt nghiệp / khen thưởng / kỷ luật
  - KeHoach: Kế hoạch giảng dạy / lịch thi
"""

from __future__ import annotations

import base64
import io
import logging
import os
import re
import uuid
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

# ─────────────────────────────────────────────────────
# In-memory task store (replace with Redis in production)
# ─────────────────────────────────────────────────────
_tasks: Dict[str, Dict[str, Any]] = {}


# ─────────────────────────────────────────────────────
# Pydantic models
# ─────────────────────────────────────────────────────
class OCRRequest(BaseModel):
    document_id: str
    file_path: str
    engine: str = "tesseract"          # "tesseract" | "vision"
    language: str = "vie+eng"
    document_type: str = "DSGD"        # "DSGD" | "QD" | "KeHoach"


class OCRTextRequest(BaseModel):
    """OCR from raw text already extracted (e.g. pasted)"""
    document_id: str
    raw_text: str
    document_type: str = "DSGD"


# ─────────────────────────────────────────────────────
# OCR helpers
# ─────────────────────────────────────────────────────

def _pdf_to_images(pdf_bytes: bytes):
    """Convert PDF bytes → list of PIL Images (requires pdf2image + poppler)."""
    try:
        from pdf2image import convert_from_bytes
        return convert_from_bytes(pdf_bytes, dpi=300)
    except Exception as exc:
        logger.warning(f"pdf2image unavailable: {exc}")
        return []


def _tesseract_ocr(images) -> str:
    """Run Tesseract OCR on a list of PIL Images."""
    try:
        import pytesseract
        pages: List[str] = []
        for img in images:
            text = pytesseract.image_to_string(img, lang="vie+eng",
                                               config="--psm 6 --oem 1")
            pages.append(text)
        return "\n\n--- PAGE BREAK ---\n\n".join(pages)
    except Exception as exc:
        logger.error(f"Tesseract OCR failed: {exc}")
        raise


def _vision_api_ocr(image_bytes: bytes) -> str:
    """Google Cloud Vision API — DOCUMENT_TEXT_DETECTION on raw image bytes."""
    api_key = os.getenv("GOOGLE_VISION_API_KEY", "")
    if not api_key:
        raise RuntimeError("GOOGLE_VISION_API_KEY not set")

    b64 = base64.b64encode(image_bytes).decode()
    payload = {
        "requests": [{
            "image": {"content": b64},
            "features": [{"type": "DOCUMENT_TEXT_DETECTION"}],
            "imageContext": {"languageHints": ["vi", "en"]},
        }]
    }
    url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
    resp = requests.post(url, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    try:
        return data["responses"][0]["fullTextAnnotation"]["text"]
    except (KeyError, IndexError):
        return ""


def _vision_api_ocr_with_credentials(image_bytes: bytes) -> str:
    """
    Google Cloud Vision API dùng Application Default Credentials (service account).
    Hỗ trợ cả chữ in lẫn chữ viết tay tiếng Việt.
    """
    try:
        from google.cloud import vision as gv
        client = gv.ImageAnnotatorClient()
        image = gv.Image(content=image_bytes)
        # DOCUMENT_TEXT_DETECTION tốt hơn TEXT_DETECTION cho dense text + handwriting
        response = client.document_text_detection(
            image=image,
            image_context=gv.ImageContext(language_hints=["vi", "en"]),
        )
        if response.error.message:
            raise RuntimeError(f"Vision API error: {response.error.message}")
        return response.full_text_annotation.text or ""
    except ImportError:
        raise RuntimeError("google-cloud-vision chưa cài. Chạy: pip install google-cloud-vision")


def _pdf_to_images_vision(pdf_bytes: bytes) -> list:
    """Chuyển PDF → list PIL Images cho Vision API (300 DPI)."""
    try:
        from pdf2image import convert_from_bytes
        return convert_from_bytes(pdf_bytes, dpi=300)
    except Exception as exc:
        logger.warning(f"pdf2image unavailable: {exc}")
        return []



    """Main OCR dispatcher: tesseract → vision fallback."""
    images = _pdf_to_images(pdf_bytes)

    if not images:
        # Treat as single-page image directly
        if engine == "vision":
            return _vision_api_ocr(pdf_bytes)
        logger.warning("No images extracted from PDF; returning empty text.")
        return ""

    if engine == "vision":
        buf = io.BytesIO()
        images[0].save(buf, format="PNG")
        return _vision_api_ocr(buf.getvalue())

    # Default: Tesseract
    return _tesseract_ocr(images)


# ─────────────────────────────────────────────────────
# Endpoint: upload PDF → OCR → return raw text
# ─────────────────────────────────────────────────────
@router.post("/process-document")
async def process_document(
    file: UploadFile = File(...),
    document_id: str = Form(...),
    document_type: str = Form("DSGD"),
    engine: str = Form("tesseract"),
):
    """
    Upload a scanned PDF → run OCR → return raw text + task_id.
    The client can poll /ocr/task/{task_id} for async updates.
    """
    task_id = f"ocr_{document_id}_{uuid.uuid4().hex[:8]}"
    _tasks[task_id] = {"status": "processing", "progress": 0, "raw_text": ""}

    try:
        pdf_bytes = await file.read()
        logger.info(f"OCR start: doc={document_id} engine={engine} size={len(pdf_bytes)}B")

        _tasks[task_id]["progress"] = 20
        raw_text = _run_ocr(pdf_bytes, engine=engine)
        _tasks[task_id]["progress"] = 80

        _tasks[task_id].update({"status": "completed", "progress": 100, "raw_text": raw_text})
        logger.info(f"OCR done: task={task_id} chars={len(raw_text)}")

        return {
            "success": True,
            "task_id": task_id,
            "status": "completed",
            "raw_text": raw_text,
            "char_count": len(raw_text),
        }
    except Exception as exc:
        logger.error(f"OCR error for task {task_id}: {exc}")
        _tasks[task_id].update({"status": "error", "error": str(exc)})
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/process-handwriting")
async def process_handwriting(
    file: UploadFile = File(...),
    document_id: str = Form(...),
    document_type: str = Form("DSGD"),
):
    """
    Upload PDF/ảnh có chữ viết tay → Google Cloud Vision API → trả raw text.
    Dùng Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS).
    """
    task_id = f"ocr_{document_id}_{uuid.uuid4().hex[:8]}"
    _tasks[task_id] = {"status": "processing", "progress": 0, "raw_text": ""}

    try:
        pdf_bytes = await file.read()
        logger.info(f"Handwriting OCR: doc={document_id} size={len(pdf_bytes)}B")

        _tasks[task_id]["progress"] = 10

        # Chuyển PDF → ảnh
        images = _pdf_to_images_vision(pdf_bytes)
        if not images:
            # File đã là ảnh (PNG/JPG) → dùng trực tiếp
            images_bytes = [pdf_bytes]
        else:
            import io as _io
            images_bytes = []
            for img in images:
                buf = _io.BytesIO()
                img.save(buf, format="PNG")
                images_bytes.append(buf.getvalue())

        _tasks[task_id]["progress"] = 30

        # OCR từng trang
        pages_text: list[str] = []
        for i, img_bytes in enumerate(images_bytes):
            logger.info(f"Vision API page {i+1}/{len(images_bytes)}")
            page_text = _vision_api_ocr_with_credentials(img_bytes)
            pages_text.append(page_text)
            _tasks[task_id]["progress"] = 30 + int(60 * (i + 1) / len(images_bytes))

        raw_text = "\n\n--- TRANG {} ---\n\n".join(pages_text) if len(pages_text) > 1 else (pages_text[0] if pages_text else "")

        _tasks[task_id].update({"status": "completed", "progress": 100, "raw_text": raw_text})
        logger.info(f"Handwriting OCR done: task={task_id} chars={len(raw_text)}")

        return {
            "success": True,
            "task_id": task_id,
            "status": "completed",
            "raw_text": raw_text,
            "char_count": len(raw_text),
            "page_count": len(images_bytes),
        }
    except Exception as exc:
        logger.error(f"Handwriting OCR error: {exc}")
        _tasks[task_id].update({"status": "error", "error": str(exc)})
        raise HTTPException(status_code=500, detail=str(exc))



async def process_text(request: OCRTextRequest):
    """Accept pre-extracted raw text; skip OCR step."""
    task_id = f"ocr_{request.document_id}_{uuid.uuid4().hex[:8]}"
    _tasks[task_id] = {
        "status": "completed",
        "progress": 100,
        "raw_text": request.raw_text,
    }
    return {
        "success": True,
        "task_id": task_id,
        "status": "completed",
        "raw_text": request.raw_text,
        "char_count": len(request.raw_text),
    }


@router.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """Poll OCR task status."""
    task = _tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"task_id": task_id, **task}


@router.delete("/task/{task_id}")
async def delete_task(task_id: str):
    """Clean up a finished task from memory."""
    _tasks.pop(task_id, None)
    return {"success": True}
