import io
import logging
import os
import re
import uuid
from typing import Any, Dict, List, Optional
import google.generativeai as genai
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from PIL import Image
import pytesseract
import cv2
import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# ── CẤU HÌNH GEMINI ────────────────────────────────
GEMINI_KEY = settings.gemini_api_key or "AIzaSyCkzKzpctSnDqRtRo93O650OE-lRkuZZp4"
GEMINI_ENABLED = False
model = None

if GEMINI_KEY and GEMINI_KEY != "YOUR_GEMINI_API_KEY":
    try:
        genai.configure(api_key=GEMINI_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        GEMINI_ENABLED = True
        logger.info(f"✅ Gemini AI configured successfully (key: {GEMINI_KEY[:20]}...)")
    except Exception as e:
        logger.error(f"❌ Gemini AI configuration failed: {e}")
        GEMINI_ENABLED = False
else:
    logger.warning("⚠️ Gemini API key not configured, will use Tesseract only")

# ── CẤU HÌNH TESSERACT ──────────────────────────────
if settings.TESSERACT_PATH and os.path.exists(settings.TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_PATH
    logger.info(f"Tesseract configured: {settings.TESSERACT_PATH}")
else:
    logger.warning(f"Tesseract not found at: {settings.TESSERACT_PATH}")

# ─────────────────────────────────────────────────────
# Pydantic models
# ─────────────────────────────────────────────────────
class OCRTextRequest(BaseModel):
    document_id: str
    raw_text: str
    document_type: str = "DSGD"

_tasks: Dict[str, Dict[str, Any]] = {}

# ─────────────────────────────────────────────────────
# TIỀN XỬ LÝ ẢNH CHO OCR
# ─────────────────────────────────────────────────────
def _preprocess_image(img: Image.Image, method: str = "adaptive") -> Image.Image:
    """
    Tiền xử lý ảnh để cải thiện độ chính xác OCR.
    
    Methods:
    - adaptive: Adaptive threshold (tốt cho ảnh có độ sáng không đều)
    - binary: Binary threshold (tốt cho ảnh scan rõ nét)
    - denoise: Khử nhiễu (tốt cho ảnh chụp bằng điện thoại)
    """
    # Chuyển PIL Image sang OpenCV format
    cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY)
    
    if method == "adaptive":
        # Adaptive threshold - tốt cho ảnh có độ sáng không đều
        cv_img = cv2.adaptiveThreshold(
            cv_img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
    elif method == "denoise":
        # Khử nhiễu trước
        cv_img = cv2.fastNlMeansDenoising(cv_img, None, 10, 7, 21)
        # Sau đó threshold
        cv_img = cv2.threshold(cv_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    else:  # binary
        # Binary threshold đơn giản
        cv_img = cv2.threshold(cv_img, 180, 255, cv2.THRESH_BINARY)[1]
    
    # Chuyển lại sang PIL Image
    return Image.fromarray(cv_img)

# ─────────────────────────────────────────────────────
# SỬA LỖI OCR THƯỜNG GẶP
# ─────────────────────────────────────────────────────
def _fix_mssv(text: str) -> str:
    """
    Sửa MSSV bị nhầm ký tự.
    Ví dụ: I10522006 → 110522006, 11O122001 → 110122001
    """
    # Loại bỏ khoảng trắng
    text = re.sub(r'\s+', '', text)
    
    # Sửa các ký tự thường bị nhầm
    replacements = {
        'I': '1',  # I (chữ i hoa) → 1
        'l': '1',  # l (chữ L thường) → 1
        'O': '0',  # O (chữ o hoa) → 0
        'o': '0',  # o (chữ o thường) → 0
        'S': '5',  # S → 5 (trong một số font)
        'Z': '2',  # Z → 2
    }
    
    # Chỉ sửa nếu text có dạng MSSV (7-12 ký tự, bắt đầu bằng số hoặc chữ)
    if len(text) >= 7 and len(text) <= 12:
        for old, new in replacements.items():
            text = text.replace(old, new)
    
    return text

def _fix_score(text: str) -> str:
    """
    Sửa điểm số bị nhầm.
    Ví dụ: 69 → 6.9, 75 → 7.5, O.5 → 0.5
    """
    text = text.strip()
    
    if not text or text in ('-', '—', 'KD', 'CT', 'KĐ'):
        return text
    
    # Thay dấu phẩy thành dấu chấm
    text = text.replace(',', '.')
    
    # Sửa O → 0, l → 1
    text = text.replace('O', '0').replace('o', '0')
    text = text.replace('l', '1').replace('I', '1')
    
    # Nếu là số 2 chữ số không có dấu chấm (69, 75, 85...)
    # và nằm trong khoảng 50-99 → thêm dấu chấm
    if re.match(r'^[5-9]\d$', text):
        text = text[0] + '.' + text[1]
    
    return text

def _fix_vietnamese_text(text: str) -> str:
    """
    Sửa lỗi dấu tiếng Việt thường gặp trong OCR.
    """
    # Sửa các lỗi dấu thường gặp
    replacements = {
        'Nguyên': 'Nguyễn',
        'Trân': 'Trần',
        'Lê': 'Lê',
        'Phạm': 'Phạm',
        'Hoàng': 'Hoàng',
        'Huỳnh': 'Huỳnh',
        'Phan': 'Phan',
        'Vũ': 'Vũ',
        'Võ': 'Võ',
        'Đặng': 'Đặng',
        'Bùi': 'Bùi',
        'Đỗ': 'Đỗ',
        'Hồ': 'Hồ',
        'Ngô': 'Ngô',
        'Dương': 'Dương',
        'Đào': 'Đào',
    }
    
    for wrong, correct in replacements.items():
        # Chỉ thay thế nếu là từ đầu tiên (họ)
        text = re.sub(r'\b' + wrong + r'\b', correct, text)
    
    return text

def _postprocess_text(raw_text: str, document_type: str = "DSGD") -> str:
    """
    Xử lý hậu kỳ toàn bộ text sau OCR.
    """
    lines = raw_text.split('\n')
    processed_lines = []
    
    for line in lines:
        # Bỏ qua dòng trống
        if not line.strip():
            processed_lines.append(line)
            continue
        
        # Tách các cột (giả sử cách nhau bằng tab hoặc nhiều khoảng trắng)
        cols = re.split(r'\t+|\s{2,}', line)
        fixed_cols = []
        
        for i, col in enumerate(cols):
            col = col.strip()
            
            # Cột MSSV (thường là cột 1 hoặc 2)
            if i in (1, 2) and re.match(r'^[A-Z0-9Il]{7,12}$', col):
                col = _fix_mssv(col)
            
            # Cột điểm (chứa số)
            elif re.match(r'^[\dOolI.,]{1,4}$', col):
                col = _fix_score(col)
            
            # Cột họ tên (chứa chữ tiếng Việt)
            elif re.search(r'[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẮẶẰẲẴẺẼẾỀỂỄỆỈỊỌỘỒỔỖỚỜỞỠỢỤỦỨỪỮỰỲỴỶỸ]', col):
                col = _fix_vietnamese_text(col)
            
            fixed_cols.append(col)
        
        # Ghép lại với tab
        processed_lines.append('\t'.join(fixed_cols))
    
    return '\n'.join(processed_lines)

# ─────────────────────────────────────────────────────
# CHUYỂN PDF THÀNH ẢNH
# ─────────────────────────────────────────────────────
def _pdf_to_images(pdf_bytes: bytes, dpi: int = 300):
    """
    Chuyển PDF thành danh sách ảnh.
    DPI cao hơn = chất lượng tốt hơn nhưng chậm hơn.
    """
    try:
        from pdf2image import convert_from_bytes
        return convert_from_bytes(
            pdf_bytes,
            dpi=dpi,
            poppler_path=r"C:\poppler\poppler-24.08.0\Library\bin"
        )
    except Exception as exc:
        logger.warning(f"pdf2image failed: {exc}")
        return []

# ─────────────────────────────────────────────────────
# TESSERACT OCR TIẾNG VIỆT
# ─────────────────────────────────────────────────────
def _tesseract_ocr(pil_images: List[Image.Image], lang: str = "vie") -> str:
    """
    OCR sử dụng Tesseract với tiếng Việt - CẢI THIỆN ĐỘ CHÍNH XÁC.
    """
    full_text = []
    
    # Cấu hình Tesseract tối ưu cho bảng điểm tiếng Việt
    # PSM 6 = Assume uniform block of text (tốt cho bảng)
    # OEM 3 = Default (LSTM + Legacy)
    custom_config = r'--psm 6 --oem 3'
    
    for i, img in enumerate(pil_images):
        try:
            logger.info(f"🔍 Tesseract đang đọc trang {i+1}/{len(pil_images)} (lang={lang})...")
            
            # Thử 3 phương pháp tiền xử lý và chọn kết quả tốt nhất
            best_text = ""
            best_confidence = 0
            best_method = ""
            
            methods = [
                ("adaptive", "Adaptive threshold"),
                ("denoise", "Denoise + Otsu"),
                ("binary", "Binary threshold")
            ]
            
            for method, method_name in methods:
                try:
                    processed_img = _preprocess_image(img, method=method)
                    
                    # Lấy confidence score
                    data = pytesseract.image_to_data(
                        processed_img, 
                        lang=lang, 
                        config=custom_config,
                        output_type=pytesseract.Output.DICT
                    )
                    
                    # Tính confidence trung bình (bỏ qua -1)
                    confidences = [int(c) for c in data['conf'] if c != '-1']
                    avg_conf = sum(confidences) / len(confidences) if confidences else 0
                    
                    # Lấy text
                    text = pytesseract.image_to_string(
                        processed_img, 
                        lang=lang, 
                        config=custom_config
                    )
                    
                    logger.debug(f"   Method {method_name}: conf={avg_conf:.1f}%, chars={len(text)}")
                    
                    # Chọn phương pháp có confidence cao nhất
                    if avg_conf > best_confidence:
                        best_confidence = avg_conf
                        best_text = text
                        best_method = method_name
                        
                except Exception as e:
                    logger.debug(f"   Method {method_name} failed: {e}")
                    continue
            
            if best_text:
                logger.info(f"✅ Trang {i+1}: {best_method}, conf={best_confidence:.1f}%, {len(best_text)} ký tự")
                full_text.append(best_text)
            else:
                logger.warning(f"⚠️ Trang {i+1}: Tất cả phương pháp thất bại")
                full_text.append(f"[Lỗi trang {i+1}]")
            
        except Exception as e:
            logger.error(f"❌ Lỗi Tesseract tại trang {i+1}: {e}")
            full_text.append(f"[Lỗi trang {i+1}]")
    
    return "\n\n--- PAGE BREAK ---\n\n".join(full_text)

# ─────────────────────────────────────────────────────
# GEMINI OCR
# ─────────────────────────────────────────────────────
def _gemini_ocr(pil_images: List[Image.Image]) -> str:
    """
    OCR sử dụng Gemini AI với prompt tối ưu cho tiếng Việt.
    """
    if not GEMINI_ENABLED or not model:
        logger.warning("⚠️ Gemini not available, using Tesseract")
        return _tesseract_ocr(pil_images, lang=settings.OCR_LANGUAGE)
    
    full_text = []
    
    prompt = """
Bạn là chuyên gia số hóa tài liệu tiếng Việt. Đây là ảnh bảng điểm sinh viên (DSGD).

YÊU CẦU:
1. Đọc và giữ nguyên đầy đủ dấu tiếng Việt (ă, â, ê, ô, ơ, ư, đ).
2. Trích xuất tất cả sinh viên trong bảng.
3. Mỗi sinh viên nằm trên một dòng, các cột cách nhau bằng dấu Tab (\\t).
4. Các cột: STT, MSSV, Họ và tên, Ngày sinh, Nơi sinh, Điểm HP1, Điểm HP2, Điểm HP3, Điểm HP4, Điểm TB, Kết quả.
5. Nếu chữ bị mờ hoặc OCR sai, hãy tự động sửa lại cho đúng tiếng Việt.
6. MSSV: Sửa I→1, l→1, O→0, o→0
7. Điểm số: Sửa dấu phẩy thành dấu chấm, O→0
8. Chỉ trả về dữ liệu bảng, không giải thích gì thêm.
"""

    for i, img in enumerate(pil_images):
        try:
            logger.info(f"🤖 Gemini đang đọc trang {i+1}/{len(pil_images)}...")
            
            # Không tiền xử lý ảnh cho Gemini (Gemini xử lý tốt ảnh gốc)
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='JPEG', quality=95)
            
            response = model.generate_content([
                prompt,
                {"mime_type": "image/jpeg", "data": img_byte_arr.getvalue()}
            ])
            
            if response.text and response.text.strip():
                logger.info(f"✅ Gemini trang {i+1}: {len(response.text)} ký tự")
                full_text.append(response.text)
            else:
                logger.warning(f"⚠️ Gemini trang {i+1} không trả về text, fallback Tesseract")
                processed_img = _preprocess_image(img, method="adaptive")
                tess_text = pytesseract.image_to_string(
                    processed_img, 
                    lang=settings.OCR_LANGUAGE,
                    config='--psm 6 --oem 3'
                )
                full_text.append(tess_text)
                
        except Exception as e:
            logger.error(f"❌ Lỗi Gemini tại trang {i+1}: {e}")
            logger.info(f"🔄 Fallback sang Tesseract trang {i+1}...")
            try:
                processed_img = _preprocess_image(img, method="adaptive")
                tess_text = pytesseract.image_to_string(
                    processed_img, 
                    lang=settings.OCR_LANGUAGE,
                    config='--psm 6 --oem 3'
                )
                logger.info(f"✅ Tesseract trang {i+1}: {len(tess_text)} ký tự")
                full_text.append(tess_text)
            except Exception as e2:
                logger.error(f"❌ Lỗi Tesseract fallback trang {i+1}: {e2}")
                full_text.append(f"[Lỗi trang {i+1}]")

    return "\n\n--- PAGE BREAK ---\n\n".join(full_text)

# ─────────────────────────────────────────────────────
# API ENDPOINT CHÍNH
# ─────────────────────────────────────────────────────
@router.post("/process-document")
async def process_document(
    file: UploadFile = File(...),
    document_id: str = Form(...),
    document_type: str = Form("DSGD"),
    engine: str = Form("gemini"),  # "gemini" | "tesseract" | "auto"
):
    """
    Xử lý OCR tài liệu.
    
    Engines:
    - gemini: Sử dụng Gemini AI (chính xác cao, có fallback Tesseract)
    - tesseract: Sử dụng Tesseract OCR với tiếng Việt
    - auto: Tự động chọn (ưu tiên Gemini)
    """
    task_id = f"ocr_{document_id}_{uuid.uuid4().hex[:8]}"
    _tasks[task_id] = {"status": "processing", "progress": 0, "raw_text": ""}

    try:
        file_bytes = await file.read()
        
        # Chuyển PDF thành ảnh
        images = _pdf_to_images(file_bytes, dpi=300)
        if not images:
            # Nếu là file ảnh sẵn
            images = [Image.open(io.BytesIO(file_bytes))]

        _tasks[task_id]["progress"] = 30

        # Chọn engine OCR
        if engine == "tesseract":
            raw_text = _tesseract_ocr(images, lang=settings.OCR_LANGUAGE)
            ocr_engine_used = f"Tesseract ({settings.OCR_LANGUAGE})"
        elif engine == "gemini" or engine == "auto":
            raw_text = _gemini_ocr(images)
            ocr_engine_used = "Gemini AI + fallback Tesseract"
        else:
            raise HTTPException(status_code=400, detail=f"Unknown engine: {engine}")

        _tasks[task_id]["progress"] = 80

        # Xử lý hậu kỳ
        raw_text = _postprocess_text(raw_text, document_type)

        _tasks[task_id].update({
            "status": "completed",
            "progress": 100,
            "raw_text": raw_text,
            "ocr_engine": ocr_engine_used
        })

        return {
            "success": True,
            "task_id": task_id,
            "raw_text": raw_text,
            "message": f"Xử lý OCR thành công ({ocr_engine_used})!"
        }

    except Exception as exc:
        logger.error(f"OCR error: {exc}", exc_info=True)
        _tasks[task_id].update({"status": "error", "error": str(exc)})
        raise HTTPException(status_code=500, detail=str(exc))

@router.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """Lấy trạng thái task OCR."""
    return _tasks.get(task_id, {"error": "Not found"})

# ─────────────────────────────────────────────────────
# HELPER FUNCTIONS (để tương thích với code cũ)
# ─────────────────────────────────────────────────────
def _ocr_quality_score(text: str) -> Dict[str, Any]:
    """
    Đánh giá chất lượng OCR dựa trên text.
    """
    issues = []
    score = 100
    
    # Kiểm tra độ dài
    if len(text) < 100:
        issues.append("Text quá ngắn")
        score -= 20
    
    # Kiểm tra ký tự lạ
    weird_chars = len(re.findall(r'[^\w\s\.,;:\-\(\)\[\]\/\\àáâãèéêìíòóôõùúăđĩũơưắặằẳẵẻẽếềểễệỉịọộồổỗớờởỡợụủứừữựỳỵỷỹÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẮẶẰẲẴẺẼẾỀỂỄỆỈỊỌỘỒỔỖỚỜỞỠỢỤỦỨỪỮỰỲỴỶỸ]', text))
    if weird_chars > 10:
        issues.append(f"Có {weird_chars} ký tự lạ")
        score -= min(30, weird_chars)
    
    # Kiểm tra MSSV
    mssv_count = len(re.findall(r'\b\d{7,12}\b', text))
    if mssv_count == 0:
        issues.append("Không tìm thấy MSSV")
        score -= 30
    
    return {
        "score": max(0, score),
        "issues": issues,
        "mssv_count": mssv_count,
        "text_length": len(text)
    }

def _run_ocr(pdf_bytes: bytes, engine: str = "gemini", document_type: str = "DSGD") -> str:
    """
    Hàm wrapper để tương thích với code cũ.
    
    Engines:
    - "gemini": Sử dụng Gemini AI (có fallback Tesseract)
    - "tesseract": Sử dụng Tesseract OCR trực tiếp
    - "auto": Tự động chọn (ưu tiên Gemini)
    """
    images = _pdf_to_images(pdf_bytes)
    if not images:
        images = [Image.open(io.BytesIO(pdf_bytes))]
    
    if engine == "tesseract":
        raw_text = _tesseract_ocr(images, lang=settings.OCR_LANGUAGE)
    elif engine == "auto" or engine == "gemini":
        # "auto" và "gemini" đều dùng Gemini với fallback Tesseract
        raw_text = _gemini_ocr(images)
    else:
        # Fallback mặc định là Gemini
        raw_text = _gemini_ocr(images)
    
    return _postprocess_text(raw_text, document_type)
