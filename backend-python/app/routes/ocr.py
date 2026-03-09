"""
OCR Service — Tesseract (local) + Google Cloud Vision API (cloud fallback).
Supports Vietnamese scanned PDFs for academic documents:
  - DSGD  : Danh sách điểm / bảng điểm sinh viên
  - QD    : Quyết định tốt nghiệp / khen thưởng / kỷ luật
  - BieuMau: Biểu mẫu hành chính
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
    document_type: str = "DSGD"        # "DSGD" | "QD" | "BieuMau"


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
        # 300 DPI → ~2480px wide for A4 — sufficient for Tesseract (no need for upscale later)
        return convert_from_bytes(pdf_bytes, dpi=300, thread_count=2)
    except Exception as exc:
        logger.warning(f"pdf2image unavailable: {exc}")
        return []


def _preprocess_image(img):
    """
    Preprocess a PIL Image before Tesseract OCR:
      1. Grayscale
      2. Upscale 2× if image is small (< 1800px wide) — Tesseract accuracy drops below ~200 DPI
      3. CLAHE contrast enhancement — handles uneven lighting better than global histogram eq
      4. Adaptive thresholding (binarise)
      5. Mild morphological closing to reconnect broken strokes
    Falls back to original image if cv2/PIL operations fail.
    """
    try:
        import cv2
        import numpy as np
        arr = np.array(img)
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY) if arr.ndim == 3 else arr

        # Upscale only truly small images (thumbnails / low-DPI scans)
        # 300 DPI source from pdf2image → ~2480px wide → skip upscale
        h, w = gray.shape[:2]
        if w < 1200:
            scale = 1200.0 / w
            gray = cv2.resize(gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

        # CLAHE — local contrast enhancement, good for faint handwriting
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)

        # Adaptive threshold: block 31×31, C=15 — handles uneven lighting well
        binary = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31, 15,
        )
        # Mild closing to reconnect broken strokes (horizontal 2-px, vertical 1-px)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 1))
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        from PIL import Image as PILImage
        return PILImage.fromarray(binary)
    except Exception as exc:
        logger.debug(f"Image preprocessing skipped: {exc}")
        return img


def _tesseract_ocr(images) -> str:
    """Run Tesseract OCR on a list of PIL Images with preprocessing."""
    try:
        import pytesseract
        pages: List[str] = []
        for img in images:
            processed = _preprocess_image(img)
            # --psm 4: single-column of varying-size text — best for grade-sheet tables
            #          (PSM 6 = uniform block, less accurate for multi-column tables)
            # --oem 1: LSTM engine (most accurate for Vietnamese)
            # preserve_interword_spaces 1: keep column gaps — our parser splits on 2+ spaces
            text = pytesseract.image_to_string(
                processed,
                lang="vie+eng",
                config="--psm 4 --oem 1 -c preserve_interword_spaces=1",
            )
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


def _run_ocr(pdf_bytes: bytes, engine: str = "tesseract") -> str:
    """Main OCR dispatcher: tesseract (default) or Google Vision API."""
    images = _pdf_to_images(pdf_bytes)

    if not images:
        # Treat as single-page image directly (PNG/JPEG input)
        if engine == "vision":
            return _vision_api_ocr(pdf_bytes)
        logger.warning("No images extracted from PDF; returning empty text.")
        return ""

    if engine == "vision":
        # Process ALL pages, not just the first one
        pages: List[str] = []
        for img in images:
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            pages.append(_vision_api_ocr(buf.getvalue()))
        return "\n\n--- PAGE BREAK ---\n\n".join(pages)

    # Default: Tesseract with preprocessing
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

        if len(pages_text) > 1:
            parts = [f"=== Trang {i + 1} ===\n{t}" for i, t in enumerate(pages_text)]
            raw_text = "\n\n".join(parts)
        else:
            raw_text = pages_text[0] if pages_text else ""

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




@router.post("/process-text")
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
