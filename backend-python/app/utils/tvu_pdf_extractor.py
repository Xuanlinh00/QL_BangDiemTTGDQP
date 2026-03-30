"""
Trích xuất bảng điểm PDF – Trường ĐH Trà Vinh
Tối ưu hóa cho backend API
"""

import re
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

# ══════════════════════════════════════════════════════════
# CONSTANTS & PATTERNS
# ══════════════════════════════════════════════════════════

DATE_RE = re.compile(r"\d{1,2}/\d{1,2}/\d{4}")
MSSV_RE = re.compile(r"1\d{8}")
TRASH_RE = re.compile(
    r"(tổng\s*số|cán\s*bộ|ghi\s*chú:|trà\s*vinh|điểm\s*qt|"
    r"hội\s*đồng|trường\s*đại|ngày\s*in|trang\s*\d|"
    r"can\s*bo|cdn\s*b[oQ0])",
    re.I | re.U
)

XEP_LOAI_VALS = {
    "xuất sắc", "giỏi", "khá", "trung bình", "yếu", "kém", 
    "không đạt", "xuat sac", "gioi", "kha", "trung binh", 
    "yeu", "kem", "khong dat"
}

KQ_VALS = {"dat", "hong", "đạt", "hỏng", "đat"}
XL_KWS = {
    "kha", "gioi", "trung", "binh", "xuat", "sac",
    "yeu", "kem", "khong", "không", "khéng"
}

STOP_WORDS = {
    "nam", "nữ", "nu", "nt", "nf", "nik", "pam", "nan",
    "nm", "nh", "ct", "mi", "e", "nam a", "nam.", "nam!"
}


# ══════════════════════════════════════════════════════════
# DATA CLASSES
# ══════════════════════════════════════════════════════════

@dataclass
class TableStructure:
    """Cấu trúc cột được phát hiện"""
    data_row: int
    mssv_col: int
    ngaysinh_col: Optional[int]
    ten_cols: List[int]
    noisinh_cols: List[int]
    score_cols: List[int]
    diem_col: Optional[int]
    xeploai_cols: List[int]
    ketqua_col: Optional[int]
    ttype: str  # 'bm1a', 'bm2', 'tong_hop'


@dataclass
class ExtractionResult:
    """Kết quả trích xuất"""
    success: bool
    data: Optional[pd.DataFrame] = None
    tables: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    method: str = "unknown"
    page_count: int = 0


# ══════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ══════════════════════════════════════════════════════════

def clean(v) -> str:
    """Làm sạch giá trị ô"""
    if v is None or (isinstance(v, float) and np.isnan(v)):
        return ""
    s = str(v).strip()
    s = re.sub(r"^[\[\|\-\s_{}(]+|[\|\]\s_{}]+$", "", s)
    return s.strip()


def mssv_from(val: str) -> str:
    """Lấy MSSV sạch"""
    try:
        return str(int(float(val)))
    except Exception:
        return re.sub(r"[^\d]", "", val)


def is_mssv(val: str) -> bool:
    """Kiểm tra MSSV hợp lệ"""
    v = mssv_from(val)
    return (len(v) == 9 and v.isdigit() and v[0] == "1") or \
           (len(v) == 10 and v.isdigit() and v[0] == "1")


def fix_score(val: str) -> str:
    """Chuẩn hóa ô điểm từ OCR"""
    v = val.strip().replace(",", ".")
    
    # CT/Cr/Cl = Cấm thi
    if re.fullmatch(r"[CcGg][TtLlRr]", v):
        return "CT"
    
    # MI = Miễn
    if v.upper() in ("MI", "M1"):
        return "MI"
    
    try:
        f = float(v)
        # OCR nhầm "7.5" → "75" hoặc "8.3" → "83"
        if 10 < f <= 100 and len(re.sub(r"\.", "", v)) == 2:
            return f"{f/10:.1f}"
        if 0 <= f <= 10:
            return f"{round(f, 1):.1f}" if "." in v else v
    except Exception:
        pass
    
    return val


def merge_xeploai(parts: list) -> str:
    """Gộp xếp loại từ nhiều ô"""
    result = " ".join(p for p in parts if p).strip()
    
    NORM = {
        "Kha": "Khá", "kha": "Khá",
        "Gioi": "Giỏi", "gioi": "Giỏi",
        "Xuat Sac": "Xuất Sắc", "Xuat sac": "Xuất Sắc",
        "Xuất sac": "Xuất Sắc", "Xuất Sac": "Xuất Sắc",
        "Trung Binh": "Trung Bình", "Trung binh": "Trung Bình",
        "Yeu": "Yếu", "Kem": "Kém",
        "Khong Dat": "Không đạt", "Khong dat": "Không đạt",
        "Khéng Dat": "Không đạt", "Khéng dat": "Không đạt",
        "Khong": "Không đạt", "Khéng": "Không đạt",
        "Không": "Không đạt",
    }
    
    return NORM.get(result, result)


def normalize_ketqua(val: str) -> str:
    """Chuẩn hóa kết quả"""
    v = val.lower()
    if "dat" in v or "đạt" in v:
        return "Đạt"
    if "hong" in v or "hỏng" in v or "khong" in v:
        return "Hỏng"
    return val


def _is_numeric_score(v: str) -> bool:
    """Kiểm tra xem có phải điểm số không"""
    v2 = v.replace(",", ".").strip()
    if v2.upper() in ("CT", "MI", "M1"):
        return True
    try:
        f = float(v2)
        return 0 <= f <= 10 or (10 < f <= 100 and len(re.sub(r"\.", "", v2)) == 2)
    except Exception:
        return False


# ══════════════════════════════════════════════════════════
# PREPROCESSING
# ══════════════════════════════════════════════════════════

def split_merged_rows(df: pd.DataFrame) -> pd.DataFrame:
    """Tách các hàng bị gộp (pdfplumber merge nhiều dòng)"""
    new_rows = []
    n_rows, n_cols = df.shape
    
    def row_as_str(r: int) -> list[str]:
        return [clean(df.iloc[r, c]) for c in range(n_cols)]
    
    i = 0
    while i < n_rows:
        raw = row_as_str(i)
        all_text = " ".join(raw)
        
        # Tìm tất cả MSSV trong hàng
        found_mssv = MSSV_RE.findall(all_text)
        seen = set()
        unique_mssv = []
        for m in found_mssv:
            if m not in seen:
                unique_mssv.append(m)
                seen.add(m)
        
        if len(unique_mssv) == 0:
            # Hàng không có MSSV → gộp vào hàng trước
            if new_rows:
                prev = new_rows[-1]
                for c, v in enumerate(raw):
                    if v and not prev[c]:
                        prev[c] = v
            i += 1
            continue
        
        if len(unique_mssv) == 1:
            # Hàng bình thường
            new_rows.append(raw)
            i += 1
            continue
        
        # Nhiều MSSV → tách ra
        all_dates = DATE_RE.findall(all_text)
        
        for idx_m, mssv in enumerate(unique_mssv):
            new_row = [""] * n_cols
            
            # Đặt MSSV
            for c, v in enumerate(raw):
                if mssv in v:
                    new_row[c] = mssv
                    break
            else:
                new_row[1] = mssv
            
            # Gán ngày sinh
            if idx_m < len(all_dates):
                for c, v in enumerate(raw):
                    if all_dates[idx_m] in v:
                        new_row[c] = all_dates[idx_m]
                        break
            
            # Trích họ tên
            name_tokens = []
            for c, v in enumerate(raw):
                if not v or mssv in v:
                    continue
                if DATE_RE.search(v):
                    continue
                if MSSV_RE.search(v):
                    continue
                name_tokens.extend(v.split())
            
            n_mssv = len(unique_mssv)
            chunk = len(name_tokens) // n_mssv if n_mssv else 0
            start = idx_m * chunk
            end = start + chunk if idx_m < n_mssv - 1 else len(name_tokens)
            new_row[2] = " ".join(name_tokens[start:end])
            
            new_rows.append(new_row)
        
        i += 1
    
    return pd.DataFrame(new_rows, columns=range(n_cols)) if new_rows else df


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    """Pipeline tiền xử lý"""
    # Thay NaN
    df = df.fillna("").astype(str).apply(
        lambda col: col.map(lambda v: "" if v in ("nan", "None", "NaN") else v.strip())
    )
    
    # Tách hàng gộp
    df = split_merged_rows(df)
    
    # Làm sạch cell
    def _clean_cell(v):
        v = str(v).strip()
        if v in ("nan", "None", ""):
            return ""
        v = re.sub(r"^[\[\|\-\s_{}]+|[\|\]\s_{}]+$", "", v)
        if re.fullmatch(r"[^\w\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ/.,]+", v):
            return ""
        return v.strip()
    
    return df.map(_clean_cell)


# ══════════════════════════════════════════════════════════
# COLUMN DETECTION
# ══════════════════════════════════════════════════════════

def detect_columns(df: pd.DataFrame) -> Optional[TableStructure]:
    """Phát hiện cấu trúc cột tự động"""
    n_rows, n_cols = df.shape
    S = {}
    
    # Tìm MSSV
    for r in range(n_rows):
        for c in range(n_cols):
            v = clean(df.iloc[r, c])
            if is_mssv(v):
                S["data_row"] = r
                S["mssv_col"] = c
                break
        if "mssv_col" in S:
            break
    
    if "mssv_col" not in S:
        return None
    
    dr, mc = S["data_row"], S["mssv_col"]
    sample = [
        [clean(df.iloc[r, c]) for c in range(n_cols)]
        for r in range(dr, min(dr + 15, n_rows))
    ]
    
    # Ngày sinh
    ns_col = None
    for c in range(mc + 1, n_cols):
        dc = sum(1 for row in sample if c < len(row) and DATE_RE.search(row[c]))
        if dc >= 2:
            ns_col = c
            break
    
    S["ngaysinh_col"] = ns_col
    S["ten_cols"] = [c for c in range(mc + 1, (ns_col or mc + 5)) if c != mc]
    
    # Nơi sinh
    noi_cols = []
    if ns_col:
        for c in range(ns_col + 1, min(ns_col + 4, n_cols)):
            vals = [row[c] for row in sample if c < len(row) and row[c]]
            if sum(1 for v in vals if len(v) > 3 and not DATE_RE.search(v)) >= 1:
                noi_cols.append(c)
            else:
                break
    
    S["noisinh_cols"] = noi_cols
    start_scan = (noi_cols[-1] + 1) if noi_cols else (ns_col + 1 if ns_col else mc + 5)
    
    # Kết quả
    ketqua_col = None
    for c in range(n_cols - 1, start_scan - 1, -1):
        vals = [row[c] for row in sample if c < len(row) and row[c]]
        if not vals:
            continue
        kq_ratio = sum(1 for v in vals if v.lower() in KQ_VALS) / len(vals)
        if kq_ratio >= 0.7:
            ketqua_col = c
            break
    
    S["ketqua_col"] = ketqua_col
    
    # Xếp loại
    end_xl = ketqua_col if ketqua_col else n_cols
    xeploai_cols = []
    for c in range(start_scan, end_xl):
        vals = [row[c] for row in sample if c < len(row) and row[c]]
        if not vals:
            continue
        xl_count = sum(1 for v in vals if any(k in v.lower() for k in XL_KWS))
        if xl_count >= 1:
            xeploai_cols.append(c)
    
    S["xeploai_cols"] = xeploai_cols
    
    # Điểm số
    exclude_cols = set(xeploai_cols) | ({ketqua_col} if ketqua_col else set()) | set(noi_cols)
    score_cols = []
    for c in range(start_scan, end_xl):
        if c in exclude_cols:
            continue
        vals = [row[c] for row in sample if c < len(row) and row[c]]
        if sum(1 for v in vals if _is_numeric_score(v)) >= 2:
            score_cols.append(c)
    
    # Điểm môn học
    diem_col = None
    if score_cols and xeploai_cols:
        candidates = [c for c in score_cols if c < xeploai_cols[0]]
        if candidates:
            diem_col = candidates[-1]
            score_cols = [c for c in score_cols if c != diem_col]
    
    S["score_cols"] = score_cols
    S["diem_col"] = diem_col
    
    # Loại bảng
    header_txt = " ".join(
        clean(df.iloc[r, c]) for r in range(dr) for c in range(n_cols)
    ).lower()
    
    if "quá trình" in header_txt or "lần 1" in header_txt:
        S["ttype"] = "bm2"
    elif len(score_cols) >= 3:
        S["ttype"] = "tong_hop"
    else:
        S["ttype"] = "bm1a"
    
    return TableStructure(**S)


# ══════════════════════════════════════════════════════════
# BUILD CLEAN DATAFRAME
# ══════════════════════════════════════════════════════════

def build_df(df: pd.DataFrame, S: TableStructure) -> pd.DataFrame:
    """Xây dựng DataFrame sạch"""
    dr, mc = S.data_row, S.mssv_col
    n_rows, n_cols = df.shape
    ttype = S.ttype
    
    # Nhãn cột điểm
    if ttype == "tong_hop":
        HP_LABELS = ["HP I L1", "HP I L2", "HP II L1", "HP II L2", 
                     "HP III L1", "HP III L2", "HP IV L1", "HP IV L2"]
    elif ttype == "bm2":
        HP_LABELS = ["Lần 1", "Lần 2", "Lần 3"]
    else:
        HP_LABELS = ["D.TBQT", "Điểm KT", "Tổng kết"]
    
    rows = []
    for r in range(dr, n_rows):
        raw = [clean(df.iloc[r, c]) for c in range(n_cols)]
        text = " ".join(raw)
        
        # Bỏ footer/rác
        if TRASH_RE.search(text.lower()):
            continue
        
        # Tìm MSSV
        mssv_raw = raw[mc] if mc < len(raw) else ""
        actual_mssv_col = mc
        
        if not is_mssv(mssv_raw):
            found = False
            for c, v in enumerate(raw):
                if is_mssv(v):
                    mssv_raw = v
                    actual_mssv_col = c
                    found = True
                    break
            
            if not found:
                for c, v in enumerate(raw):
                    digits = re.sub(r"[^\d]", "", v)
                    if 9 <= len(digits) <= 10 and digits[0] == "1":
                        mssv_raw = digits
                        actual_mssv_col = c
                        found = True
                        break
            
            if not found:
                continue
        
        rec = {}
        rec["MSSV"] = mssv_from(mssv_raw)
        rec["STT"] = re.sub(r"[^\d]", "", raw[actual_mssv_col - 1]) if actual_mssv_col > 0 else ""
        
        # Họ và tên
        ten_parts = []
        for c in S.ten_cols:
            if c >= len(raw) or not raw[c]:
                continue
            v = raw[c]
            if re.fullmatch(r"[\d\s/.,|\-_{}\[\]()]+", v):
                continue
            if v.lower() in STOP_WORDS:
                continue
            if len(v) <= 1 and not v.isalpha():
                continue
            ten_parts.append(v)
        
        rec["Họ và tên SV"] = " ".join(ten_parts)
        
        # Ngày sinh
        ns_col = S.ngaysinh_col
        ns_raw = raw[ns_col] if ns_col and ns_col < len(raw) else ""
        m = DATE_RE.search(ns_raw)
        if m:
            rec["Ngày sinh"] = m.group()
        else:
            digits = re.sub(r"[^\d]", "", ns_raw)
            if len(digits) == 8:
                rec["Ngày sinh"] = f"{digits[:2]}/{digits[2:4]}/{digits[4:]}"
            elif len(digits) == 7:
                rec["Ngày sinh"] = f"{digits[:2]}/{digits[2:4]}/20{digits[4:]}" if digits[4:6] < "30" else f"{digits[:2]}/{digits[2:4]}/19{digits[4:]}"
            else:
                rec["Ngày sinh"] = ns_raw
        
        # Nơi sinh
        noi = [raw[c] for c in S.noisinh_cols if c < len(raw) and raw[c]]
        rec["Nơi sinh"] = " ".join(noi)
        
        # Điểm học phần
        for i, c in enumerate(S.score_cols[:8]):
            lbl = HP_LABELS[i] if i < len(HP_LABELS) else f"Điểm_{i+1}"
            rec[lbl] = fix_score(raw[c]) if c < len(raw) and raw[c] else ""
        
        # Điểm môn học
        dc = S.diem_col
        if dc and dc < len(raw) and raw[dc]:
            rec["Điểm môn học"] = fix_score(raw[dc])
        
        # Xếp loại
        xl_parts = [
            raw[c] for c in S.xeploai_cols
            if c < len(raw) and raw[c] and raw[c].lower() not in KQ_VALS
        ]
        rec["Xếp loại"] = merge_xeploai(xl_parts)
        
        # Kết quả
        kq_c = S.ketqua_col
        if kq_c and kq_c < len(raw) and raw[kq_c]:
            rec["Kết quả"] = normalize_ketqua(raw[kq_c])
        
        rows.append(rec)
    
    df_out = pd.DataFrame(rows)
    if not df_out.empty and "MSSV" in df_out.columns:
        df_out = df_out.drop_duplicates(subset=["MSSV"], keep="first")
    
    return df_out


# ══════════════════════════════════════════════════════════
# PDF EXTRACTION METHODS
# ══════════════════════════════════════════════════════════

def extract_with_pdfplumber(pdf_path: Path) -> List[Dict[str, Any]]:
    """Trích xuất bằng pdfplumber"""
    try:
        import pdfplumber
    except ImportError:
        logger.warning("pdfplumber not installed")
        return []
    
    tables = []
    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            for pn, page in enumerate(pdf.pages, 1):
                for tbl in (page.extract_tables() or []):
                    if tbl and len(tbl) >= 3:
                        df_raw = pd.DataFrame(tbl)
                        df_pre = preprocess(df_raw)
                        tables.append({
                            "page": pn,
                            "raw": df_pre,
                            "method": "pdfplumber"
                        })
    except Exception as e:
        logger.error(f"pdfplumber error: {e}")
    
    return tables


def extract_with_camelot(pdf_path: Path) -> List[Dict[str, Any]]:
    """Trích xuất bằng camelot"""
    try:
        import camelot
    except ImportError:
        logger.warning("camelot not installed")
        return []
    
    tables = []
    try:
        for flavor in ("lattice", "stream"):
            tbls = camelot.read_pdf(str(pdf_path), pages="all", flavor=flavor)
            for ct in tbls:
                if ct.df.shape[0] >= 3:
                    df_pre = preprocess(ct.df)
                    tables.append({
                        "page": ct.page,
                        "raw": df_pre,
                        "method": f"camelot-{flavor}"
                    })
            if tables:
                break
    except Exception as e:
        logger.error(f"camelot error: {e}")
    
    return tables


def extract_with_ocr(pdf_path: Path) -> List[Dict[str, Any]]:
    """Trích xuất bằng OCR (Tesseract)"""
    try:
        from pdf2image import convert_from_path
        import pytesseract
        from PIL import ImageEnhance, ImageFilter
    except ImportError:
        logger.warning("pdf2image or pytesseract not installed")
        return []
    
    tables = []
    try:
        logger.info("OCR scanning...")
        images = convert_from_path(str(pdf_path), dpi=300)
        
        for pn, img in enumerate(images, 1):
            logger.info(f"Processing page {pn}/{len(images)}")
            
            # Tiền xử lý ảnh
            img = img.convert("L")
            img = img.filter(ImageFilter.MedianFilter(3))
            img = ImageEnhance.Contrast(img).enhance(2.5)
            
            # OCR
            data = pytesseract.image_to_data(
                img,
                config=r"--oem 3 --psm 6 -l vie+eng",
                output_type=pytesseract.Output.DATAFRAME
            )
            
            data = data[data["conf"] > 20].dropna(subset=["text"])
            data["text"] = data["text"].astype(str).str.strip()
            data = data[data["text"] != ""]
            
            if data.empty:
                continue
            
            # Cluster theo hàng
            tops = data["top"].values
            labels = np.zeros(len(tops), dtype=int)
            idx = np.argsort(tops)
            g = 0
            for i in range(1, len(idx)):
                if tops[idx[i]] - tops[idx[i-1]] > 15:
                    g += 1
                labels[idx[i]] = g
            
            data["row_id"] = labels
            
            lines = []
            for _, grp in data.groupby("row_id"):
                grp = grp.sort_values("left")
                lines.append(list(zip(grp["left"].values, grp["text"].values)))
            
            if not lines:
                continue
            
            # Cluster theo cột
            all_x = sorted({x for line in lines for x, _ in line})
            col_clusters = []
            for x in all_x:
                placed = False
                for cl in col_clusters:
                    if abs(x - cl[0]) < 40:
                        cl.append(x)
                        placed = True
                        break
                if not placed:
                    col_clusters.append([x])
            
            col_centers = sorted(int(np.mean(cl)) for cl in col_clusters)
            
            grid = []
            for line in lines:
                row = [""] * len(col_centers)
                for x, tok in line:
                    best = min(range(len(col_centers)), key=lambda k: abs(col_centers[k] - x))
                    row[best] = (row[best] + " " + tok).strip() if row[best] else tok
                grid.append(row)
            
            tables.append({
                "page": pn,
                "raw": pd.DataFrame(grid),
                "method": "OCR"
            })
    
    except Exception as e:
        logger.error(f"OCR error: {e}")
    
    return tables


# ══════════════════════════════════════════════════════════
# MAIN EXTRACTOR CLASS
# ══════════════════════════════════════════════════════════

class TVUPDFExtractor:
    """Trích xuất bảng điểm PDF Trường ĐH Trà Vinh"""
    
    @staticmethod
    def extract(pdf_path: str, force_ocr: bool = False) -> ExtractionResult:
        """
        Trích xuất dữ liệu từ PDF
        
        Args:
            pdf_path: Đường dẫn file PDF
            force_ocr: Bắt buộc dùng OCR
        
        Returns:
            ExtractionResult với dữ liệu đã trích xuất
        """
        path = Path(pdf_path)
        
        if not path.exists():
            return ExtractionResult(
                success=False,
                error=f"File not found: {pdf_path}"
            )
        
        logger.info(f"Processing: {path.name}")
        
        # Thu thập bảng thô
        raw_tables = []
        method_used = "unknown"
        
        if not force_ocr:
            logger.info("Trying pdfplumber...")
            raw_tables = extract_with_pdfplumber(path)
            method_used = "pdfplumber"
            
            if not raw_tables:
                logger.info("Trying camelot...")
                raw_tables = extract_with_camelot(path)
                method_used = "camelot"
        
        if not raw_tables:
            logger.info("Trying OCR...")
            raw_tables = extract_with_ocr(path)
            method_used = "OCR"
        
        if not raw_tables:
            return ExtractionResult(
                success=False,
                error="No tables extracted",
                method=method_used
            )
        
        # Xử lý từng bảng
        clean_tables = []
        for entry in raw_tables:
            S = detect_columns(entry["raw"])
            if not S:
                continue
            
            df_clean = build_df(entry["raw"], S)
            if df_clean.empty:
                continue
            
            clean_tables.append({
                "page": entry["page"],
                "type": S.ttype,
                "method": entry["method"],
                "df": df_clean,
            })
        
        if not clean_tables:
            return ExtractionResult(
                success=False,
                error="No valid data after processing",
                method=method_used
            )
        
        # Tổng hợp
        combined = pd.concat([ct["df"] for ct in clean_tables], ignore_index=True)
        combined.drop_duplicates(subset=["MSSV"], keep="first", inplace=True)
        combined.sort_values("MSSV", inplace=True, ignore_index=True)
        
        total_sv = len(combined)
        logger.info(f"Extracted {len(clean_tables)} tables | {total_sv} students")
        
        return ExtractionResult(
            success=True,
            data=combined,
            tables=clean_tables,
            method=method_used,
            page_count=len(raw_tables)
        )
    
    @staticmethod
    def extract_to_dict(pdf_path: str, force_ocr: bool = False) -> Dict[str, Any]:
        """
        Trích xuất và trả về dict (cho API)
        
        Returns:
            {
                "success": bool,
                "data": list of records,
                "summary": {...},
                "error": str (if failed)
            }
        """
        result = TVUPDFExtractor.extract(pdf_path, force_ocr)
        
        if not result.success:
            return {
                "success": False,
                "error": result.error,
                "method": result.method
            }
        
        # Convert DataFrame to records (replace NaN with empty string)
        result.data = result.data.fillna("")
        records = result.data.to_dict(orient="records")
        
        # Summary
        summary = {
            "total_students": len(records),
            "total_tables": len(result.tables) if result.tables else 0,
            "method": result.method,
            "page_count": result.page_count,
            "table_types": {}
        }
        
        if result.tables:
            for tbl in result.tables:
                ttype = tbl["type"]
                summary["table_types"][ttype] = summary["table_types"].get(ttype, 0) + 1
        
        return {
            "success": True,
            "data": records,
            "summary": summary
        }
    
    @staticmethod
    def extract_to_excel(pdf_path: str, output_path: Optional[str] = None, 
                        force_ocr: bool = False) -> Dict[str, Any]:
        """
        Trích xuất và xuất ra Excel
        
        Returns:
            {
                "success": bool,
                "output_file": str,
                "summary": {...}
            }
        """
        result = TVUPDFExtractor.extract(pdf_path, force_ocr)
        
        if not result.success:
            return {
                "success": False,
                "error": result.error
            }
        
        # Tạo output path
        if not output_path:
            output_path = str(Path(pdf_path).with_suffix(".xlsx"))
        
        try:
            with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
                # Tóm tắt
                summary_data = [
                    {
                        "Trang": ct["page"],
                        "Loại": ct["type"],
                        "Phương pháp": ct["method"],
                        "Số SV": len(ct["df"])
                    }
                    for ct in result.tables
                ]
                pd.DataFrame(summary_data).to_excel(writer, sheet_name="Tóm tắt", index=False)
                
                # Từng bảng
                seen = {}
                for ct in result.tables:
                    base = f"T{ct['page']}_{ct['type'][:5]}"
                    seen[base] = seen.get(base, 0) + 1
                    suf = f"_{seen[base]}" if seen[base] > 1 else ""
                    sheet = (base + suf)[:31]
                    
                    ct["df"].to_excel(writer, sheet_name=sheet, index=False)
                    
                    # Auto-adjust column width
                    ws = writer.sheets[sheet]
                    for i, col in enumerate(ct["df"].columns, 1):
                        max_len = max(
                            len(str(col)),
                            ct["df"][col].astype(str).str.len().max() if len(ct["df"]) else 0
                        )
                        ws.column_dimensions[ws.cell(1, i).column_letter].width = min(max_len + 2, 45)
                
                # Tổng hợp
                result.data.to_excel(writer, sheet_name="Tổng hợp tất cả", index=False)
                ws = writer.sheets["Tổng hợp tất cả"]
                for i, col in enumerate(result.data.columns, 1):
                    max_len = max(
                        len(str(col)),
                        result.data[col].astype(str).str.len().max() if len(result.data) else 0
                    )
                    ws.column_dimensions[ws.cell(1, i).column_letter].width = min(max_len + 2, 45)
            
            logger.info(f"Saved to: {output_path}")
            
            return {
                "success": True,
                "output_file": output_path,
                "summary": {
                    "total_students": len(result.data),
                    "total_tables": len(result.tables),
                    "method": result.method
                }
            }
        
        except Exception as e:
            logger.error(f"Error saving Excel: {e}")
            return {
                "success": False,
                "error": str(e)
            }
