"""Routes for table extraction and export."""

import logging
import os
import tempfile
from pathlib import Path
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.utils import ExcelExporter, TableDetector, WordExporter

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_EXTENSIONS = {"txt", "csv", "log"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS


@router.post("/detect-tables")
async def detect_tables(file: UploadFile = File(...)):
    """
    Detect tables in uploaded file.

    Returns:
        JSON with detected tables
    """
    try:
        if not allowed_file(file.filename):
            raise HTTPException(status_code=400, detail="File type not allowed")

        # Read file content
        content = await file.read()

        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")

        # Decode content
        text_content = content.decode("utf-8", errors="ignore")

        # Detect tables
        tables = TableDetector.detect_tables(text_content)

        # Convert to JSON
        tables_data = [table.to_dict() for table in tables]

        return {"success": True, "count": len(tables), "tables": tables_data}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error detecting tables: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/to-excel")
async def export_to_excel(file: UploadFile = File(...)):
    """
    Export detected tables to Excel file.

    Returns:
        Excel file
    """
    try:
        if not allowed_file(file.filename):
            raise HTTPException(status_code=400, detail="File type not allowed")

        # Read file content
        content = await file.read()

        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")

        # Decode content
        text_content = content.decode("utf-8", errors="ignore")

        # Detect tables
        tables = TableDetector.detect_tables(text_content)

        if not tables:
            raise HTTPException(status_code=400, detail="No tables detected")

        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            # Export to Excel
            if ExcelExporter.export(tables, tmp_path):
                return FileResponse(
                    tmp_path,
                    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    filename="export.xlsx",
                )
            else:
                raise HTTPException(status_code=500, detail="Failed to export")
        except Exception as e:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            raise

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting to Excel: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/to-word")
async def export_to_word(file: UploadFile = File(...)):
    """
    Export detected tables to Word file.

    Returns:
        Word file
    """
    try:
        if not allowed_file(file.filename):
            raise HTTPException(status_code=400, detail="File type not allowed")

        # Read file content
        content = await file.read()

        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")

        # Decode content
        text_content = content.decode("utf-8", errors="ignore")

        # Detect tables
        tables = TableDetector.detect_tables(text_content)

        if not tables:
            raise HTTPException(status_code=400, detail="No tables detected")

        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            # Export to Word
            if WordExporter.export(tables, tmp_path):
                return FileResponse(
                    tmp_path,
                    media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    filename="export.docx",
                )
            else:
                raise HTTPException(status_code=500, detail="Failed to export")
        except Exception as e:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            raise

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting to Word: {e}")
        raise HTTPException(status_code=500, detail=str(e))
