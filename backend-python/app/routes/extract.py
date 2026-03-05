"""
Data Extraction Service
-----------------------
Parses raw OCR text from Vietnamese academic documents into structured records.

Supported document types:
  DSGD     – Danh sách điểm / bảng điểm (student score sheets)
  QD       – Quyết định (administrative decisions — graduation, awards, etc.)
  KeHoach  – Kế hoạch giảng dạy / lịch thi (teaching / exam schedules)
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


# ═══════════════════════════════════════════════════════
# Pydantic models
# ═══════════════════════════════════════════════════════

class ExtractRequest(BaseModel):
    document_id: str
    raw_text: str
    document_type: str = "DSGD"   # "DSGD" | "QD" | "KeHoach"


class StudentRecord(BaseModel):
    stt: Optional[str] = None          # Số thứ tự
    ho_ten: Optional[str] = None       # Họ và tên sinh viên
    mssv: Optional[str] = None         # Mã số sinh viên
    lop: Optional[str] = None          # Lớp
    diem_qp: Optional[float] = None    # Điểm GDQP-AN (lần 1)
    diem_lan2: Optional[float] = None  # Điểm thi lại (nếu có)
    ket_qua: Optional[str] = None      # Đạt / Không đạt / Miễn
    ghi_chu: Optional[str] = None      # Ghi chú


class DecisionRecord(BaseModel):
    so_quyet_dinh: Optional[str] = None    # Số quyết định
    ngay_ky: Optional[str] = None          # Ngày ký
    nguoi_ky: Optional[str] = None         # Người ký
    noi_dung: Optional[str] = None         # Nội dung quyết định
    don_vi: Optional[str] = None           # Đơn vị ban hành
    doi_tuong: List[str] = []              # Danh sách đối tượng


class ScheduleRecord(BaseModel):
    ngay: Optional[str] = None
    tiet: Optional[str] = None
    mon_hoc: Optional[str] = None
    giang_vien: Optional[str] = None
    phong: Optional[str] = None
    lop: Optional[str] = None


class ExtractResponse(BaseModel):
    success: bool
    document_type: str
    records: List[Dict[str, Any]]
    meta: Dict[str, Any]
    warnings: List[str]


# ═══════════════════════════════════════════════════════
# Vietnamese text normalization helpers
# ═══════════════════════════════════════════════════════

def _normalize(text: str) -> str:
    """Collapse whitespace, normalize newlines."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def _clean_score(raw: str) -> Optional[float]:
    """Convert various score representations to float."""
    raw = raw.strip().replace(",", ".")
    try:
        val = float(raw)
        return round(val, 2) if 0.0 <= val <= 10.0 else None
    except ValueError:
        return None


_VIET_NAME_PATTERN = re.compile(
    r"\b([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẮẶẰẲẴẺẼẾỀỂỄỆỈỊỌỘỒỔỖỚỜỞỠỢỤỦỨỪỮỰỲỴỶỸ]["
    r"a-zàáâãèéêìíòóôõùúăđĩũơưắặằẳẵẻẽếềểễệỉịọộồổỗớờởỡợụủứừữựỳỵỷỹ]+"
    r"(?:\s+[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẮẶẰẲẴẺẼẾỀỂỄỆỈỊỌỘỒỔỖỚỜỞỠỢỤỦỨỪỮỰỲỴỶỸ]["
    r"a-zàáâãèéêìíòóôõùúăđĩũơưắặằẳẵẻẽếềểễệỉịọộồổỗớờởỡợụủứừữựỳỵỷỹ]+){1,4})\b"
)

_MSSV_PATTERN = re.compile(
    r"\b(DA|DT|DL|DC|DK|DH|DQ|DX|DV|DG|TC|LT|MH|ND|NQ|"
    r"\d{7,10}|[A-Z]{2}\d{7,9})\b"
)

_SCORE_PATTERNS = [
    re.compile(r"(?:điểm|đ)[:\s]+(\d+(?:[.,]\d{1,2})?)"),
    re.compile(r"\b(\d(?:[.,]\d{1,2})?)\s*/\s*10\b"),
]

_DECISION_NO_PATTERN = re.compile(
    r"(?:Số|số|QĐ|QĐTL)[:\s/-]*"
    r"(\d+\s*/\s*(?:QĐ|QĐTL|TB|CV|KH|HD|NQ|TT|BC|BB)[-/\w]*)",
    re.IGNORECASE,
)

_DATE_PATTERN = re.compile(
    r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b"
    r"|\bngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})\b",
    re.IGNORECASE,
)


# ═══════════════════════════════════════════════════════
# Parser: DSGD — bảng điểm sinh viên
# ═══════════════════════════════════════════════════════

def _parse_dsgd(text: str) -> tuple[List[Dict], Dict, List[str]]:
    """
    Extract student records from a score sheet.
    Handles both tabular (fixed-column) and line-by-line formats.
    """
    records: List[Dict] = []
    warnings: List[str] = []
    meta: Dict[str, Any] = {}

    # Try to detect class name
    m = re.search(r"(?:Lớp|lớp)[:\s]+([A-Z0-9]{2,20})", text)
    if m:
        meta["lop"] = m.group(1).strip()

    # Try to detect subject
    m = re.search(r"(?:Môn|môn|Học phần)[:\s]+(.{5,60}?)(?:\n|Mã)", text)
    if m:
        meta["mon_hoc"] = m.group(1).strip()

    lines = text.split("\n")

    # ── Strategy 1: Parse well-formatted table rows ──
    # Row pattern: STT  HỌ TÊN  MSSV  LỚP  ĐIỂM  KẾT QUẢ
    table_row = re.compile(
        r"^(\d{1,3})\s+"                          # STT
        r"(.{5,50}?)\s{2,}"                       # HO TEN (at least 2 spaces before MSSV)
        r"([A-Z0-9]{6,12})\s+"                   # MSSV
        r"([A-Z0-9]{2,15})\s+"                   # LOP
        r"(\d(?:[.,]\d{1,2})?)"                  # DIEM
        r"(?:\s+(\d(?:[.,]\d{1,2})?))?",         # DIEM_LAN2 optional
        re.UNICODE,
    )

    matched_table = False
    for line in lines:
        line = line.strip()
        m = table_row.match(line)
        if m:
            matched_table = True
            score1 = _clean_score(m.group(5))
            score2 = _clean_score(m.group(6)) if m.group(6) else None
            ket_qua = "Đạt" if (score1 and score1 >= 5.0) else "Không đạt" if score1 is not None else None
            records.append(StudentRecord(
                stt=m.group(1),
                ho_ten=m.group(2).strip(),
                mssv=m.group(3).strip(),
                lop=m.group(4).strip(),
                diem_qp=score1,
                diem_lan2=score2,
                ket_qua=ket_qua,
            ).model_dump())

    # ── Strategy 2: fallback — find MSSV & name on same/adjacent lines ──
    if not matched_table:
        warnings.append("Không tìm thấy bảng điểm chuẩn; dùng fallback parser.")
        seen_mssv: set = set()
        for i, line in enumerate(lines):
            mssv_m = _MSSV_PATTERN.search(line)
            if not mssv_m:
                continue
            mssv = mssv_m.group(0)
            if mssv in seen_mssv:
                continue
            seen_mssv.add(mssv)

            # Search name in same line or previous line
            ctx = " ".join(lines[max(0, i - 1): i + 2])
            name_m = _VIET_NAME_PATTERN.search(ctx)
            ho_ten = name_m.group(0) if name_m else None

            score: Optional[float] = None
            for sp in _SCORE_PATTERNS:
                sm = sp.search(ctx)
                if sm:
                    score = _clean_score(sm.group(1))
                    break

            records.append(StudentRecord(
                ho_ten=ho_ten,
                mssv=mssv,
                diem_qp=score,
                ket_qua="Đạt" if (score and score >= 5.0) else "Không đạt" if score is not None else None,
            ).model_dump())

    meta["total_records"] = len(records)
    if records:
        scores = [r["diem_qp"] for r in records if r.get("diem_qp") is not None]
        if scores:
            meta["diem_trung_binh"] = round(sum(scores) / len(scores), 2)
            meta["so_dat"] = sum(1 for s in scores if s >= 5.0)
            meta["so_khong_dat"] = sum(1 for s in scores if s < 5.0)
            meta["ty_le_dat"] = round(meta["so_dat"] / len(scores) * 100, 1)

    return records, meta, warnings


# ═══════════════════════════════════════════════════════
# Parser: QĐ — Quyết định hành chính
# ═══════════════════════════════════════════════════════

def _parse_quyet_dinh(text: str) -> tuple[List[Dict], Dict, List[str]]:
    records: List[Dict] = []
    warnings: List[str] = []
    meta: Dict[str, Any] = {}

    dec = DecisionRecord()

    # Decision number
    m = _DECISION_NO_PATTERN.search(text)
    if m:
        dec.so_quyet_dinh = m.group(1).strip()
        meta["so_quyet_dinh"] = dec.so_quyet_dinh

    # Signing date
    m = _DATE_PATTERN.search(text)
    if m:
        if m.group(1):
            dec.ngay_ky = m.group(1)
        elif m.group(2):
            dec.ngay_ky = f"{m.group(2).zfill(2)}/{m.group(3).zfill(2)}/{m.group(4)}"
        meta["ngay_ky"] = dec.ngay_ky

    # Signer
    for pattern in [
        r"(?:Hiệu trưởng|Giám đốc|Trưởng phòng|Viện trưởng)[,\s\n]+(.{5,60}?)\n",
        r"(?:Ký tên|Ký)[,\s\n]+(.{5,60}?)\n",
    ]:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            dec.nguoi_ky = m.group(1).strip()
            meta["nguoi_ky"] = dec.nguoi_ky
            break

    # Subject summary (first meaningful sentence after "Về việc" or "V/v")
    m = re.search(r"[Vv][/.]?[Vv]\s*(.{10,150}?)(?:\.|;|\n)", text)
    if m:
        dec.noi_dung = m.group(1).strip()
        meta["noi_dung"] = dec.noi_dung

    # Issuing unit
    m = re.search(r"(?:TRƯỜNG|Trường|ĐẠI HỌC|Đại học|HỌC VIỆN|Học viện)\s+(.{5,80}?)(?:\n|,)", text)
    if m:
        dec.don_vi = m.group(0).strip()
        meta["don_vi"] = dec.don_vi

    # Named individuals in numbered list (common in QD)
    individuals = re.findall(
        r"\d+\.\s+(?:Ông|Bà|Anh|Chị)?\s*([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẮẶẰẲẴẺẼẾỀỂỄỆỈỊỌỘỒỔỖỚỜỞỠỢỤỦỨỪỮỰỲỴỶỸ][a-zàáâãèéêìíòóôõùúăđĩũơưắặằẳẵẻẽếềểễệỉịọộồổỗớờởỡợụủứừữựỳỵỷỹ]+(?:\s+[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẮẶẰẲẴẺẼẾỀỂỄỆỈỊỌỘỒỔỖỚỜỞỠỢỤỦỨỪỮỰỲỴỶỸ][a-zàáâãèéêìíòóôõùúăđĩũơưắặằẳẵẻẽếềểễệỉịọộồổỗớờởỡợụủứừữựỳỵỷỹ]+){1,4})",
        text,
    )
    dec.doi_tuong = individuals
    meta["doi_tuong_count"] = len(individuals)

    records.append(dec.model_dump())
    return records, meta, warnings


# ═══════════════════════════════════════════════════════
# Parser: Kế hoạch / Lịch thi
# ═══════════════════════════════════════════════════════

def _parse_ke_hoach(text: str) -> tuple[List[Dict], Dict, List[str]]:
    records: List[Dict] = []
    warnings: List[str] = []
    meta: Dict[str, Any] = {}

    lines = text.split("\n")
    # Typical schedule row: DATE  TIET  SUBJECT  TEACHER  ROOM  CLASS
    schedule_row = re.compile(
        r"(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\s+"  # date
        r"(\d{1,2}[-–]\d{1,2}|\d{1,2})\s+"           # tiet
        r"(.{5,50}?)\s{2,}"                           # mon hoc
        r"(.{5,40}?)\s{2,}"                           # giang vien
        r"([A-Z0-9.]{2,10})\s+"                       # phong
        r"([A-Z0-9]{2,15})",                          # lop
    )
    for line in lines:
        m = schedule_row.match(line.strip())
        if m:
            records.append(ScheduleRecord(
                ngay=m.group(1),
                tiet=m.group(2),
                mon_hoc=m.group(3).strip(),
                giang_vien=m.group(4).strip(),
                phong=m.group(5),
                lop=m.group(6),
            ).model_dump())

    if not records:
        warnings.append("Không parse được lịch theo định dạng chuẩn.")
    meta["total_records"] = len(records)
    return records, meta, warnings


# ═══════════════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════════════

@router.post("/parse-document", response_model=ExtractResponse)
async def parse_document(request: ExtractRequest):
    """
    Parse raw OCR text into structured records depending on document_type.
    Returns records ready to display in the Review UI and save to DB.
    """
    try:
        logger.info(f"Parsing: doc={request.document_id} type={request.document_type}")
        text = _normalize(request.raw_text)

        if request.document_type == "DSGD":
            records, meta, warnings = _parse_dsgd(text)
        elif request.document_type == "QD":
            records, meta, warnings = _parse_quyet_dinh(text)
        elif request.document_type == "KeHoach":
            records, meta, warnings = _parse_ke_hoach(text)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown document_type: {request.document_type}")

        return ExtractResponse(
            success=True,
            document_type=request.document_type,
            records=records,
            meta=meta,
            warnings=warnings,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Extract error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/validate-data")
async def validate_data(payload: Dict[str, Any]):
    """
    Validate a list of records submitted after user review + manual corrections.
    Returns per-record errors.
    """
    records: List[Dict] = payload.get("records", [])
    errors: List[Dict] = []

    for i, rec in enumerate(records):
        row_errors: List[str] = []
        # MSSV format check
        mssv = rec.get("mssv", "")
        if mssv and not re.match(r"^[A-Z0-9]{6,12}$", mssv):
            row_errors.append(f"MSSV '{mssv}' không đúng định dạng")
        # Score range check
        for field in ("diem_qp", "diem_lan2"):
            val = rec.get(field)
            if val is not None:
                try:
                    fval = float(val)
                    if not (0 <= fval <= 10):
                        row_errors.append(f"{field} = {fval} vượt ngoài khoảng [0,10]")
                except (TypeError, ValueError):
                    row_errors.append(f"{field} = '{val}' không phải số hợp lệ")
        if row_errors:
            errors.append({"row": i, "errors": row_errors})

    return {
        "success": len(errors) == 0,
        "total": len(records),
        "error_count": len(errors),
        "errors": errors,
    }


@router.post("/demo-text")
async def get_demo_text():
    """Return a sample Vietnamese bảng điểm for UI testing."""
    sample = """TRƯỜNG ĐẠI HỌC TRÀ VINH
BỘ MÔN GIÁO DỤC QUỐC PHÒNG - AN NINH

BẢNG ĐIỂM THI KẾT THÚC HỌC PHẦN
Học phần: Giáo dục Quốc phòng - An ninh (Học phần 3)
Lớp: DA21TYC  Học kỳ 1  Năm học: 2023-2024

STT  HỌ VÀ TÊN          MSSV         LỚP       ĐIỂM  KẾT QUẢ
1    Nguyễn Văn An      DA210001     DA21TYC   7.5   Đạt
2    Trần Thị Bình      DA210002     DA21TYC   8.0   Đạt
3    Lê Quốc Cường      DA210003     DA21TYC   4.5   Không đạt
4    Phạm Hoàng Dũng    DA210004     DA21TYC   6.0   Đạt
5    Hoàng Thị Ê        DA210005     DA21TYC   9.0   Đạt
6    Vũ Ngọc Phúc       DA210006     DA21TYC   5.5   Đạt
7    Đặng Minh Quân     DA210007     DA21TYC   3.0   Không đạt
8    Bùi Thị Hương      DA210008     DA21TYC   7.0   Đạt

                                    Trà Vinh, ngày 15 tháng 12 năm 2023
                                    Giảng viên phụ trách
                                    Nguyễn Văn Giảng
"""
    return {"raw_text": sample, "document_type": "DSGD"}

