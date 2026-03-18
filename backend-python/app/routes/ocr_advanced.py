"""Advanced OCR routes for image processing and table extraction."""

import logging
import os
import tempfile
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse

from app.utils import (
    AdvancedOCRProcessor,
    BatchOCRProcessor,
    ExcelExporter,
    Table,
    TesseractOCR,
)

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "bmp", "gif", "tiff"}
ALLOWED_DOCUMENT_EXTENSIONS = {"txt", "csv", "log", "pdf"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def allowed_file(filename: str, allowed_ext: set) -> bool:
    """Check if file extension is allowed."""
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in allowed_ext


@router.post("/process-image")
async def process_image(
    file: UploadFile = File(...),
    extract_tables: bool = Query(True),
    preprocess: bool = Query(False),
    lang: str = Query("eng"),
):
    """
    Process image and extract text and tables.

    Args:
        file: Image file (PNG, JPG, BMP, etc.)
        extract_tables: Whether to extract tables
        preprocess: Whether to preprocess image for better OCR
        lang: Language code (eng, vie, etc.)

    Returns:
        JSON with extracted text, regions, and tables
    """
    try:
        if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
            raise HTTPException(status_code=400, detail="Image format not allowed")

        # Read file
        content = await file.read()

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")

        # Save to temp file
        with tempfile.NamedTemporaryFile(
            suffix=Path(file.filename).suffix, delete=False
        ) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Check if Tesseract is available
            if TesseractOCR.is_available():
                result = AdvancedOCRProcessor.process_image_advanced(
                    tmp_path, preprocess=preprocess, lang=lang, extract_tables=extract_tables
                )
            else:
                logger.warning("Tesseract not available, returning empty result")
                result = {
                    "success": False,
                    "text": "",
                    "regions": [],
                    "tables": [],
                    "image_path": file.filename,
                    "language": lang,
                }

            return result

        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...), lang: str = Query("eng")):
    """
    Extract text from image.

    Args:
        file: Image file
        lang: Language code

    Returns:
        Extracted text
    """
    try:
        if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
            raise HTTPException(status_code=400, detail="Image format not allowed")

        content = await file.read()

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")

        # Save to temp file
        with tempfile.NamedTemporaryFile(
            suffix=Path(file.filename).suffix, delete=False
        ) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            if TesseractOCR.is_available():
                text = TesseractOCR.extract_text(tmp_path, lang)
            else:
                text = ""

            return {"success": bool(text), "text": text, "language": lang}

        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting text: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect-text-regions")
async def detect_text_regions(
    file: UploadFile = File(...), lang: str = Query("eng")
):
    """
    Detect text regions with bounding boxes.

    Args:
        file: Image file
        lang: Language code

    Returns:
        List of text regions with confidence and bounding boxes
    """
    try:
        if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
            raise HTTPException(status_code=400, detail="Image format not allowed")

        content = await file.read()

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")

        # Save to temp file
        with tempfile.NamedTemporaryFile(
            suffix=Path(file.filename).suffix, delete=False
        ) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            if TesseractOCR.is_available():
                regions = TesseractOCR.detect_text_regions(tmp_path, lang)
            else:
                regions = []

            return {"success": True, "regions": regions, "count": len(regions)}

        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error detecting text regions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-tables-from-image")
async def extract_tables_from_image(
    file: UploadFile = File(...), lang: str = Query("eng")
):
    """
    Extract tables from image.

    Args:
        file: Image file
        lang: Language code

    Returns:
        Detected tables
    """
    try:
        if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
            raise HTTPException(status_code=400, detail="Image format not allowed")

        content = await file.read()

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")

        # Save to temp file
        with tempfile.NamedTemporaryFile(
            suffix=Path(file.filename).suffix, delete=False
        ) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            if TesseractOCR.is_available():
                tables = TesseractOCR.extract_tables_from_image(tmp_path, lang)
            else:
                tables = []

            return {"success": True, "tables": tables, "count": len(tables)}

        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting tables: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image-to-excel")
async def image_to_excel(file: UploadFile = File(...), lang: str = Query("eng")):
    """
    Extract tables from image and export to Excel.

    Args:
        file: Image file
        lang: Language code

    Returns:
        Excel file
    """
    try:
        if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
            raise HTTPException(status_code=400, detail="Image format not allowed")

        content = await file.read()

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")

        # Save to temp file
        with tempfile.NamedTemporaryFile(
            suffix=Path(file.filename).suffix, delete=False
        ) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Extract tables
            if TesseractOCR.is_available():
                tables_data = TesseractOCR.extract_tables_from_image(tmp_path, lang)
            else:
                tables_data = []

            if not tables_data:
                raise HTTPException(status_code=400, detail="No tables detected in image")

            # Convert to Table objects
            tables: List[Table] = []
            for table_data in tables_data:
                table = Table(
                    headers=table_data.get("headers", []),
                    rows=table_data.get("rows", []),
                    title=f"Table from {Path(file.filename).stem}",
                )
                tables.append(table)

            # Export to Excel
            with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp_excel:
                excel_path = tmp_excel.name

            if ExcelExporter.export(tables, excel_path):
                return FileResponse(
                    excel_path,
                    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    filename="extracted_tables.xlsx",
                )
            else:
                raise HTTPException(status_code=500, detail="Failed to export to Excel")

        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error converting image to Excel: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-process")
async def batch_process(
    files: List[UploadFile] = File(...),
    extract_tables: bool = Query(True),
    lang: str = Query("eng"),
):
    """
    Process multiple images in batch.

    Args:
        files: List of image files
        extract_tables: Whether to extract tables
        lang: Language code

    Returns:
        List of processing results
    """
    try:
        temp_files: List[str] = []

        try:
            # Save all files to temp
            for file in files:
                if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
                    raise HTTPException(
                        status_code=400, detail=f"Invalid format: {file.filename}"
                    )

                content = await file.read()

                if len(content) > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=400, detail=f"File too large: {file.filename}"
                    )

                with tempfile.NamedTemporaryFile(
                    suffix=Path(file.filename).suffix, delete=False
                ) as tmp:
                    tmp.write(content)
                    temp_files.append(tmp.name)

            # Process batch
            if TesseractOCR.is_available():
                results = AdvancedOCRProcessor.batch_process_images(
                    temp_files, preprocess=False, lang=lang, extract_tables=extract_tables
                )
            else:
                results = BatchOCRProcessor.process_batch(temp_files, extract_tables)

            return {"success": True, "count": len(results), "results": results}

        finally:
            # Clean up temp files
            for tmp_path in temp_files:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error batch processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-to-excel")
async def batch_to_excel(
    files: List[UploadFile] = File(...), lang: str = Query("eng")
):
    """
    Process multiple images and export all tables to single Excel file.

    Args:
        files: List of image files
        lang: Language code

    Returns:
        Excel file with all tables
    """
    try:
        temp_files: List[str] = []

        try:
            # Save all files to temp
            for file in files:
                if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
                    raise HTTPException(
                        status_code=400, detail=f"Invalid format: {file.filename}"
                    )

                content = await file.read()

                if len(content) > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=400, detail=f"File too large: {file.filename}"
                    )

                with tempfile.NamedTemporaryFile(
                    suffix=Path(file.filename).suffix, delete=False
                ) as tmp:
                    tmp.write(content)
                    temp_files.append(tmp.name)

            # Process batch
            if TesseractOCR.is_available():
                results = AdvancedOCRProcessor.batch_process_images(
                    temp_files, preprocess=False, lang=lang, extract_tables=True
                )
            else:
                results = BatchOCRProcessor.process_batch(temp_files, True)

            # Export to Excel
            with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp_excel:
                excel_path = tmp_excel.name

            if TesseractOCR.is_available():
                success = AdvancedOCRProcessor.export_results_to_excel(
                    results, excel_path
                )
            else:
                success = BatchOCRProcessor.export_batch_to_excel(results, excel_path)

            if success:
                return FileResponse(
                    excel_path,
                    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    filename="batch_tables.xlsx",
                )
            else:
                raise HTTPException(status_code=400, detail="No tables found in images")

        finally:
            # Clean up temp files
            for tmp_path in temp_files:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error batch converting to Excel: {e}")
        raise HTTPException(status_code=500, detail=str(e))
