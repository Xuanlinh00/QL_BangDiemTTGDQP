"""
DSGD Parser — Phân tích raw OCR text → dữ liệu có cấu trúc.
Hỗ trợ: Bảng điểm sinh viên (DSGD), Quyết định (QD), Biểu mẫu (BieuMau).

PIPELINE:
  1. Phát hiện header bảng → xác định vị trí cột
  2. Phân tích từng hàng dữ liệu
  3. Validate & làm sạch từng trường
  4. Tính toán lại điểm tổng nếu cần
  5. Trả về list[StudentRecord] + metadata
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────
# Data models
# ─────────────────────────────────────────────────────

@dataclass
class ScoreRecord:
    """Điểm từng học phần (HP1–HP4), mỗi HP có L1 và L2."""
    hp1_l1: Optional[float] = None
    hp1_l2: Optional[float] = None
    hp2_l1: Optional[float] = None
    hp2_l2: Optional[float] = None
    hp3_l1: Optional[float] = None
    hp3_l2: Optional[float] = None
    hp4_l1: Optional[float] = None
    hp4_l2: Optional[float] = None
    diem_mon_hoc: Optional[float] = None   # Điểm môn học tổng
    xep_loai: Optional[str] = None         # Giỏi / Khá / Trung bình / ...
    ket_qua: Optional[str] = None          # Đạt / Không đạt / Hỏng


@dataclass
class StudentRecord:
    stt: int = 0
    mssv: str = ""
    ho_va_ten: str = ""
    ngay_sinh: str = ""
    noi_sinh: str = ""
    scores: ScoreRecord = field(default_factory=ScoreRecord)
    # Trường riêng cho parser nhanh (không đủ cột)
    raw_scores: List[str] = field(default_factory=list)
    confidence: float = 1.0   # 0–1, do parser tự đánh giá
    warnings: List[str] = field(default_factory=list)


@dataclass
class DSGDDocument:
    """Kết quả parse toàn bộ file bảng điểm."""
    truong: str = ""
    don_vi: str = ""
    ma_lop: str = ""
    mon_hoc: str = ""
    nam_hoc: str = ""
    tong_sv: int = 0
    sv_dat: int = 0
    sv_hong: int = 0
    students: List[StudentRecord] = field(default_factory=list)
    raw_text: str = ""
    parse_warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        return d


# ─────────────────────────────────────────────────────
# Regex patterns
# ─────────────────────────────────────────────────────

# MSSV: 7–12 chữ số (đã được fix_mssv() trong ocr_service)
_RE_MSSV = re.compile(r"^\d{7,12}$")

# Ngày sinh: dd/mm/yyyy hoặc dd-mm-yyyy
_RE_DATE = re.compile(r"\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\b")

# Điểm số: 0–10, tối đa 1 chữ số thập phân
_RE_SCORE = re.compile(r"^\d{1,2}([.,]\d)?$")

# Xếp loại
_RE_XEPLOAI = re.compile(
    r"\b(Giỏi|Khá|Trung\s*bình|Yếu|Xuất\s*sắc|TB|kha|gioi)\b",
    re.IGNORECASE | re.UNICODE,
)

# Kết quả
_RE_KETQUA = re.compile(
    r"\b(Đạt|Không\s*đạt|Hỏng|dat|hong|KĐ|KD)\b",
    re.IGNORECASE | re.UNICODE,
)

# Header bảng điểm — các từ khoá thường xuất hiện trong hàng tiêu đề
_HEADER_KEYWORDS = {
    "mssv", "họ", "tên", "ngày", "sinh", "nơi", "hp", "l1", "l2",
    "điểm", "xếp", "loại", "kết", "quả", "stt", "tt",
}

# Từ khoá metadata ở đầu file
_META_PATTERNS = {
    "truong": re.compile(r"TRƯỜNG\s+(.+?)(?:\n|$)", re.IGNORECASE),
    "don_vi": re.compile(r"ĐƠN VỊ LIÊN KẾT[:\s]+(.+?)(?:\n|$)", re.IGNORECASE),
    "ma_lop": re.compile(r"MÃ LỚP[:\s]+(\w+)", re.IGNORECASE),
    "mon_hoc": re.compile(r"MÔN HỌC[:\s]+(.+?)(?:\n|$)", re.IGNORECASE),
    "nam_hoc": re.compile(r"NĂM HỌC[:\s]+(.+?)(?:\n|$)", re.IGNORECASE),
}

_TONG_PATTERNS = {
    "tong_sv": re.compile(r"TỔNG\s+SỐ\s+SINH\s+VIÊN[^\d]*(\d+)", re.IGNORECASE),
    "sv_dat": re.compile(r"SỐ\s+SINH\s+VIÊN\s+ĐẠT[^\d]*(\d+)", re.IGNORECASE),
    "sv_hong": re.compile(r"SỐ\s+SINH\s+VIÊN\s+HỎNG[^\d]*(\d+)", re.IGNORECASE),
}


# ─────────────────────────────────────────────────────
# Utility functions
# ─────────────────────────────────────────────────────

def _parse_score(raw: str) -> Optional[float]:
    """Chuyển chuỗi điểm → float, trả None nếu không hợp lệ."""
    if not raw or raw.strip() in ("", "-", "—", "KD", "CT", "KĐ"):
        return None
    cleaned = raw.strip().replace(",", ".").replace("O", "0").replace("o", "0")
    if not _RE_SCORE.match(cleaned):
        return None
    try:
        val = float(cleaned)
        return val if 0.0 <= val <= 10.0 else None
    except ValueError:
        return None


def _normalize_date(raw: str) -> str:
    """Chuẩn hoá ngày sinh về dd/mm/yyyy."""
    m = _RE_DATE.search(raw)
    if not m:
        return raw.strip()
    d, mo, y = m.group(1), m.group(2), m.group(3)
    return f"{d.zfill(2)}/{mo.zfill(2)}/{y}"


def _normalize_xeploai(raw: str) -> str:
    """Chuẩn hoá xếp loại."""
    mapping = {
        "giỏi": "Giỏi", "gioi": "Giỏi",
        "khá": "Khá", "kha": "Khá",
        "trung bình": "Trung bình", "tb": "Trung bình",
        "yếu": "Yếu",
        "xuất sắc": "Xuất sắc",
    }
    key = raw.strip().lower()
    return mapping.get(key, raw.strip())


def _normalize_ketqua(raw: str) -> str:
    """Chuẩn hoá kết quả."""
    mapping = {
        "đạt": "Đạt", "dat": "Đạt",
        "không đạt": "Không đạt", "hong": "Hỏng", "hỏng": "Hỏng",
        "kđ": "Không đạt", "kd": "Không đạt",
    }
    key = raw.strip().lower()
    return mapping.get(key, raw.strip())


def _is_header_row(cols: List[str]) -> bool:
    """Nhận biết hàng header dựa trên từ khoá."""
    combined = " ".join(cols).lower()
    hits = sum(1 for kw in _HEADER_KEYWORDS if kw in combined)
    return hits >= 3


def _is_data_row(cols: List[str]) -> bool:
    """
    Hàng dữ liệu sinh viên: cột đầu là STT (số nguyên dương),
    cột tiếp theo là MSSV (7–12 chữ số hoặc format cũ).
    CẢI THIỆN: Hỗ trợ nhiều format MSSV khác nhau.
    """
    if len(cols) < 3:
        return False
    
    stt_raw = cols[0].strip()
    if not stt_raw.isdigit() or int(stt_raw) > 999:
        return False
    
    mssv_raw = re.sub(r"\s+", "", cols[1].strip())
    
    # Hỗ trợ các format MSSV:
    # - Mới: 110122001, 112522006 (9-10 chữ số bắt đầu 1)
    # - Prefix: DA210001, DT20A (2-3 chữ + 5-8 chữ số)
    # - Cũ: 07.606.01691 (format có dấu chấm)
    mssv_patterns = [
        r"^1[01]\d{7,8}$",           # 110122001, 112522006
        r"^[A-Z]{1,3}\d{5,10}$",     # DA210001, DT20A
        r"^\d{2}\.\d{3}\.\d{5}$",    # 07.606.01691
        r"^\d{7,12}$",               # 1234567 - 123456789012
    ]
    
    for pattern in mssv_patterns:
        if re.match(pattern, mssv_raw):
            return True
    
    return False


# ─────────────────────────────────────────────────────
# Column layout detector
# ─────────────────────────────────────────────────────

class ColumnLayout:
    """
    Suy luận vị trí các cột từ hàng header.
    Bảng điểm GDQP-AN có layout đặc trưng:
      STT | MSSV | Họ Tên | Ngày sinh | Nơi sinh |
      HP1_L1 HP1_L2 | HP2_L1 HP2_L2 | HP3_L1 HP3_L2 | HP4_L1 HP4_L2 |
      Điểm MH | Xếp loại | Kết quả
    """

    KNOWN_LAYOUTS = {
        # Bảng điểm GDQP-AN: 14 cột dữ liệu
        14: {
            "stt": 0, "mssv": 1, "ho_va_ten": 2,
            "ngay_sinh": 3, "noi_sinh": 4,
            "hp1_l1": 5, "hp1_l2": 6,
            "hp2_l1": 7, "hp2_l2": 8,
            "hp3_l1": 9, "hp3_l2": 10,
            "hp4_l1": 11, "hp4_l2": 12,
            "diem_mon_hoc": 13, "xep_loai": 14, "ket_qua": 15,
        },
        # Bảng điểm đơn giản: không chia L1/L2
        8: {
            "stt": 0, "mssv": 1, "ho_va_ten": 2,
            "ngay_sinh": 3, "noi_sinh": 4,
            "diem_qp": 5, "l2": 6, "ket_qua": 7,
        },
    }

    def __init__(self, header_cols: List[str]):
        self.col_map: Dict[str, int] = {}
        self.n_cols = len(header_cols)
        self._detect(header_cols)

    def _detect(self, cols: List[str]):
        """Phát hiện vị trí cột từ header text - CẢI THIỆN."""
        combined_lower = [c.lower().strip() for c in cols]

        # Tìm các cột cố định
        for i, c in enumerate(combined_lower):
            if c in ("stt", "tt", "số thứ tự"):
                self.col_map["stt"] = i
            elif "mssv" in c or "mã sv" in c or "mã sinh viên" in c:
                self.col_map["mssv"] = i
            elif "họ" in c and "tên" in c:
                self.col_map["ho_va_ten"] = i
            elif "họ" in c or "tên" in c:
                # Nếu chỉ có "họ" hoặc "tên" riêng, cũng ghi nhận
                if "ho_va_ten" not in self.col_map:
                    self.col_map["ho_va_ten"] = i
            elif "ngày" in c and "sinh" in c:
                self.col_map["ngay_sinh"] = i
            elif "nơi" in c and "sinh" in c:
                self.col_map["noi_sinh"] = i
            elif "xếp" in c or "loại" in c:
                self.col_map["xep_loai"] = i
            elif "kết" in c or "quả" in c:
                self.col_map["ket_qua"] = i
            elif "điểm" in c and ("mh" in c or "môn" in c or "tb" in c):
                self.col_map["diem_mon_hoc"] = i
            elif "hp" in c and "l1" in c:
                # HP1_L1, HP1_L2, ...
                if "hp1_l1" not in self.col_map:
                    self.col_map["hp1_l1"] = i
            elif "hp" in c and "l2" in c:
                if "hp1_l2" not in self.col_map:
                    self.col_map["hp1_l2"] = i

        # Nếu không detect được → dùng layout mặc định theo số cột
        if len(self.col_map) < 4:
            closest = min(
                self.KNOWN_LAYOUTS.keys(),
                key=lambda k: abs(k - self.n_cols),
            )
            self.col_map = self.KNOWN_LAYOUTS[closest].copy()
            logger.debug(f"Column layout fallback to {closest}-col template")

    def get(self, name: str, default: int = -1) -> int:
        return self.col_map.get(name, default)


# ─────────────────────────────────────────────────────
# Core parser
# ─────────────────────────────────────────────────────

def _split_row(line: str) -> List[str]:
    """
    Phân tách hàng: ưu tiên tab, fallback khoảng trắng >= 2.
    CẢI THIỆN: Xử lý tốt hơn các format khác nhau.
    """
    if not line:
        return []
    
    # Ưu tiên tab
    if "\t" in line:
        cols = line.split("\t")
    else:
        # Khoảng trắng >= 2 → phân tách cột
        # Nhưng giữ lại khoảng trắng đơn trong tên
        cols = re.split(r"  +", line)
    
    # Loại bỏ cột rỗng đầu/cuối, nhưng giữ cột rỗng ở giữa
    result = []
    for col in cols:
        result.append(col.strip())
    
    # Loại bỏ cột rỗng ở đầu và cuối
    while result and not result[0]:
        result.pop(0)
    while result and not result[-1]:
        result.pop()
    
    return result


def _parse_student_row(
    cols: List[str],
    layout: ColumnLayout,
    warnings: List[str],
) -> Optional[StudentRecord]:
    """Phân tích một hàng dữ liệu sinh viên."""

    def get_col(name: str, default: str = "") -> str:
        idx = layout.get(name)
        if idx < 0 or idx >= len(cols):
            return default
        return cols[idx].strip()

    try:
        stt_raw = get_col("stt")
        stt = int(stt_raw) if stt_raw.isdigit() else 0

        mssv = re.sub(r"\s+", "", get_col("mssv"))
        ho_va_ten = get_col("ho_va_ten")
        ngay_sinh_raw = get_col("ngay_sinh")
        noi_sinh = get_col("noi_sinh")

        # Validate MSSV
        rec_warnings: List[str] = []
        confidence = 1.0

        if not _RE_MSSV.match(mssv):
            rec_warnings.append(f"MSSV nghi ngờ: '{mssv}'")
            confidence -= 0.3

        # Validate tên (ít nhất 2 từ, gồm chữ cái tiếng Việt)
        if len(ho_va_ten.split()) < 2:
            rec_warnings.append(f"Tên có thể bị cắt: '{ho_va_ten}'")
            confidence -= 0.2

        ngay_sinh = _normalize_date(ngay_sinh_raw)

        # Điểm số
        scores = ScoreRecord(
            hp1_l1=_parse_score(get_col("hp1_l1")),
            hp1_l2=_parse_score(get_col("hp1_l2")),
            hp2_l1=_parse_score(get_col("hp2_l1")),
            hp2_l2=_parse_score(get_col("hp2_l2")),
            hp3_l1=_parse_score(get_col("hp3_l1")),
            hp3_l2=_parse_score(get_col("hp3_l2")),
            hp4_l1=_parse_score(get_col("hp4_l1")),
            hp4_l2=_parse_score(get_col("hp4_l2")),
            diem_mon_hoc=_parse_score(get_col("diem_mon_hoc")),
            xep_loai=_normalize_xeploai(get_col("xep_loai")),
            ket_qua=_normalize_ketqua(get_col("ket_qua")),
        )

        # Giữ raw scores để debug
        raw_scores = cols[layout.get("hp1_l1", 5):] if layout.get("hp1_l1", 5) >= 0 else []

        # Tính lại điểm môn nếu bị thiếu nhưng có đủ điểm thành phần
        if scores.diem_mon_hoc is None:
            scores.diem_mon_hoc = _recalculate_diem_mon(scores, rec_warnings)
            if scores.diem_mon_hoc is not None:
                rec_warnings.append("Điểm môn tính lại từ thành phần")

        # Tự suy kết quả nếu trống
        if not scores.ket_qua and scores.diem_mon_hoc is not None:
            scores.ket_qua = "Đạt" if scores.diem_mon_hoc >= 5.0 else "Không đạt"
            rec_warnings.append("Kết quả suy luận tự động")

        if rec_warnings:
            warnings.extend([f"STT {stt}: {w}" for w in rec_warnings])

        return StudentRecord(
            stt=stt,
            mssv=mssv,
            ho_va_ten=ho_va_ten,
            ngay_sinh=ngay_sinh,
            noi_sinh=noi_sinh,
            scores=scores,
            raw_scores=raw_scores,
            confidence=max(0.0, confidence),
            warnings=rec_warnings,
        )

    except Exception as exc:
        logger.debug(f"Row parse error: {exc} | cols={cols}")
        warnings.append(f"Hàng lỗi bỏ qua: {cols[:4]}")
        return None


def _recalculate_diem_mon(scores: ScoreRecord, warnings: List[str]) -> Optional[float]:
    """
    Tính lại điểm môn học GDQP-AN theo công thức:
    Điểm MH = (HP1×3 + HP2×2 + HP3×1 + HP4×2) / 8
    Dùng L2 nếu có, ngược lại dùng L1.
    """
    def pick(l1, l2):
        return l2 if l2 is not None else l1

    hp1 = pick(scores.hp1_l1, scores.hp1_l2)
    hp2 = pick(scores.hp2_l1, scores.hp2_l2)
    hp3 = pick(scores.hp3_l1, scores.hp3_l2)
    hp4 = pick(scores.hp4_l1, scores.hp4_l2)

    components = [x for x in [hp1, hp2, hp3, hp4] if x is not None]
    weights    = [w for x, w in zip([hp1, hp2, hp3, hp4], [3, 2, 1, 2]) if x is not None]

    if len(components) == 4:
        total = sum(v * w for v, w in zip(components, weights))
        return round(total / 8, 1)
    elif components:
        # Nếu thiếu thành phần → trung bình đơn giản
        warnings.append("Thiếu điểm thành phần, dùng trung bình đơn giản")
        return round(sum(components) / len(components), 1)

    return None


# ─────────────────────────────────────────────────────
# Metadata extractor
# ─────────────────────────────────────────────────────

def _extract_metadata(text: str) -> Dict[str, Any]:
    """Trích xuất thông tin tiêu đề từ phần đầu tài liệu."""
    meta: Dict[str, Any] = {}
    for key, pattern in _META_PATTERNS.items():
        m = pattern.search(text)
        if m:
            meta[key] = m.group(1).strip()

    for key, pattern in _TONG_PATTERNS.items():
        m = pattern.search(text)
        if m:
            try:
                meta[key] = int(m.group(1))
            except ValueError:
                pass

    return meta


# ─────────────────────────────────────────────────────
# Main parse entry point
# ─────────────────────────────────────────────────────

def parse_dsgd(raw_text: str) -> DSGDDocument:
    """
    Phân tích toàn bộ raw OCR text → DSGDDocument có cấu trúc.
    CẢI THIỆN: Xử lý tốt hơn các format khác nhau, trích xuất đầy đủ dữ liệu.

    Args:
        raw_text: Kết quả OCR từ ocr_service._run_ocr()

    Returns:
        DSGDDocument với danh sách students, metadata, và warnings.
    """
    doc = DSGDDocument(raw_text=raw_text)
    parse_warnings: List[str] = []

    if not raw_text or not raw_text.strip():
        doc.parse_warnings = ["Raw text rỗng"]
        return doc

    # ── Tách theo page break (hỗ trợ nhiều format) ──
    pages = re.split(
        r"(?:---\s*(?:PAGE\s+)?BREAK\s*---|Trang\s+\d+|Trang\s+\d+/\d+)",
        raw_text,
        flags=re.IGNORECASE
    )
    all_lines: List[str] = []
    for page in pages:
        all_lines.extend(page.splitlines())

    # ── Trích metadata từ toàn bộ text ──
    meta = _extract_metadata(raw_text)
    doc.truong = meta.get("truong", "")
    doc.don_vi = meta.get("don_vi", "")
    doc.ma_lop = meta.get("ma_lop", "")
    doc.mon_hoc = meta.get("mon_hoc", "")
    doc.nam_hoc = meta.get("nam_hoc", "")
    doc.tong_sv = meta.get("tong_sv", 0)
    doc.sv_dat = meta.get("sv_dat", 0)
    doc.sv_hong = meta.get("sv_hong", 0)

    # ── Phát hiện header & xác định layout cột ──
    layout: Optional[ColumnLayout] = None
    data_start_idx = 0

    for i, line in enumerate(all_lines):
        cols = _split_row(line)
        if len(cols) >= 4 and _is_header_row(cols):
            layout = ColumnLayout(cols)
            data_start_idx = i + 1
            logger.info(f"Header detected at line {i}: {cols[:6]}")
            break

    if layout is None:
        parse_warnings.append("Không tìm thấy hàng header; dùng layout 14 cột mặc định")
        layout = ColumnLayout([])  # fallback layout

    # ── Parse từng hàng dữ liệu ──
    students: List[StudentRecord] = []
    consecutive_non_data = 0
    in_data_section = False

    for line in all_lines[data_start_idx:]:
        line_stripped = line.strip()

        # Bỏ qua hàng trống hoặc page break
        if not line_stripped or re.search(r"PAGE\s+BREAK|Trang\s+\d+", line_stripped, re.IGNORECASE):
            continue

        # Dừng nếu gặp phần tổng kết (cuối bảng)
        # Nhưng tiếp tục nếu đang trong phần dữ liệu (có thể có nhiều bảng)
        if re.search(r"tổng\s+số\s+(?:sinh\s+viên|sv|bài)", line_stripped, re.IGNORECASE):
            if in_data_section:
                # Có thể là cuối bảng, nhưng tiếp tục để xem có bảng khác không
                consecutive_non_data += 1
                if consecutive_non_data > 5:
                    break
            continue

        cols = _split_row(line_stripped)

        if _is_data_row(cols):
            consecutive_non_data = 0
            in_data_section = True
            record = _parse_student_row(cols, layout, parse_warnings)
            if record:
                students.append(record)
        else:
            consecutive_non_data += 1
            # Hàng liên tiếp không phải data → log để debug
            if consecutive_non_data == 1 and len(cols) > 2:
                logger.debug(f"Non-data row skipped: {cols[:4]}")

    doc.students = students
    doc.parse_warnings = parse_warnings

    # ── Cập nhật tổng nếu metadata thiếu ──
    if doc.tong_sv == 0:
        doc.tong_sv = len(students)
    if doc.sv_dat == 0:
        doc.sv_dat = sum(
            1 for s in students
            if s.scores.ket_qua and "đạt" in s.scores.ket_qua.lower()
               and "không" not in s.scores.ket_qua.lower()
        )
    if doc.sv_hong == 0:
        doc.sv_hong = sum(
            1 for s in students
            if s.scores.ket_qua and (
                "không đạt" in s.scores.ket_qua.lower()
                or "hỏng" in s.scores.ket_qua.lower()
            )
        )

    logger.info(
        f"Parse done: {len(students)} students, "
        f"{doc.sv_dat} đạt, {doc.sv_hong} hỏng, "
        f"{len(parse_warnings)} warnings"
    )

    return doc


# ─────────────────────────────────────────────────────
# QD Parser (Quyết định)
# ─────────────────────────────────────────────────────

@dataclass
class QDRecord:
    so_quyet_dinh: str = ""
    ngay_ky: str = ""
    noi_dung: str = ""
    doi_tuong: str = ""    # Tốt nghiệp / Khen thưởng / Kỷ luật
    danh_sach: List[str] = field(default_factory=list)


def parse_qd(raw_text: str) -> QDRecord:
    """Phân tích Quyết định (QD): trích số QĐ, ngày ký, nội dung."""
    record = QDRecord()

    m = re.search(r"SỐ[:\s]+(\d+[/-][\w]+)", raw_text, re.IGNORECASE)
    if m:
        record.so_quyet_dinh = m.group(1).strip()

    m = re.search(r"ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})", raw_text, re.IGNORECASE)
    if m:
        record.ngay_ky = f"{m.group(1).zfill(2)}/{m.group(2).zfill(2)}/{m.group(3)}"

    # Danh sách người trong QĐ
    for line in raw_text.splitlines():
        cols = _split_row(line)
        if len(cols) >= 2 and cols[0].strip().isdigit():
            record.danh_sach.append(" | ".join(c for c in cols if c))

    return record


# ─────────────────────────────────────────────────────
# Dispatcher
# ─────────────────────────────────────────────────────

def parse_document(raw_text: str, document_type: str = "DSGD") -> Any:
    """
    Điều phối parser theo loại tài liệu.

    Args:
        raw_text: Raw OCR text
        document_type: "DSGD" | "QD" | "BieuMau"

    Returns:
        DSGDDocument | QDRecord | dict
    """
    dt = document_type.upper().strip()

    if dt == "DSGD":
        return parse_dsgd(raw_text)
    elif dt == "QD":
        return parse_qd(raw_text)
    else:
        # BieuMau: chỉ trả raw text theo cấu trúc key-value
        result = {}
        for line in raw_text.splitlines():
            if ":" in line:
                key, _, val = line.partition(":")
                result[key.strip()] = val.strip()
        return result