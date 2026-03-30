"""
API routes for TVU PDF extraction
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
from pathlib import Path
import tempfile
import logging
from typing import Optional

from app.utils.tvu_pdf_extractor import TVUPDFExtractor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tvu", tags=["TVU Extraction"])


@router.post("/extract")
async def extract_pdf(
    file: UploadFile = File(...),
    force_ocr: bool = Query(False, description="Force OCR extraction"),
    output_format: str = Query("json", description="Output format: json or excel")
):
    """
    Trích xuất bảng điểm từ PDF Trường ĐH Trà Vinh
    
    - **file**: File PDF cần trích xuất
    - **force_ocr**: Bắt buộc dùng OCR (mặc định: False)
    - **output_format**: Định dạng đầu ra (json hoặc excel)
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Lưu file tạm
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        if output_format == "excel":
            # Trích xuất và xuất Excel
            result = TVUPDFExtractor.extract_to_excel(tmp_path, force_ocr=force_ocr)
            
            if not result["success"]:
                raise HTTPException(status_code=500, detail=result.get("error", "Extraction failed"))
            
            # Trả về file Excel
            output_file = result["output_file"]
            return FileResponse(
                output_file,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                filename=f"{Path(file.filename).stem}_extracted.xlsx"
            )
        
        else:
            # Trích xuất và trả JSON
            result = TVUPDFExtractor.extract_to_dict(tmp_path, force_ocr=force_ocr)
            
            if not result["success"]:
                raise HTTPException(status_code=500, detail=result.get("error", "Extraction failed"))
            
            return result
    
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Xóa file tạm
        try:
            Path(tmp_path).unlink()
        except Exception:
            pass


@router.post("/extract-batch")
async def extract_batch(
    files: list[UploadFile] = File(...),
    force_ocr: bool = Query(False, description="Force OCR extraction")
):
    """
    Trích xuất nhiều file PDF cùng lúc
    """
    results = []
    
    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            results.append({
                "filename": file.filename,
                "success": False,
                "error": "Not a PDF file"
            })
            continue
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            result = TVUPDFExtractor.extract_to_dict(tmp_path, force_ocr=force_ocr)
            result["filename"] = file.filename
            results.append(result)
        
        except Exception as e:
            logger.error(f"Error processing {file.filename}: {e}")
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })
        
        finally:
            try:
                Path(tmp_path).unlink()
            except Exception:
                pass
    
    return {
        "total_files": len(files),
        "successful": sum(1 for r in results if r.get("success")),
        "failed": sum(1 for r in results if not r.get("success")),
        "results": results
    }


@router.get("/health")
async def health_check():
    """Kiểm tra trạng thái service"""
    try:
        import pdfplumber
        has_pdfplumber = True
    except ImportError:
        has_pdfplumber = False
    
    try:
        import camelot
        has_camelot = True
    except ImportError:
        has_camelot = False
    
    try:
        import pytesseract
        from pdf2image import convert_from_path
        has_ocr = True
    except ImportError:
        has_ocr = False
    
    return {
        "status": "healthy",
        "capabilities": {
            "pdfplumber": has_pdfplumber,
            "camelot": has_camelot,
            "ocr": has_ocr
        }
    }
