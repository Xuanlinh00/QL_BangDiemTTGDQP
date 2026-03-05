"""
Reconcile Service
-----------------
So sánh (đối chiếu) dữ liệu giữa các tài liệu:
  - Bảng điểm (DSGD)  ↔  Quyết định (QD)
  - Kiểm tra sinh viên nào Đạt nhưng chưa có trong QĐ
  - Kiểm tra sinh viên trong QĐ nhưng không có trong bảng điểm
  - Phát hiện sai lệch điểm số, lớp, họ tên

Endpoint chính:
  POST /reconcile/compare          — so sánh 2 tập dữ liệu
  POST /reconcile/compare-decision — so sánh bảng điểm vs quyết định
  POST /reconcile/find-duplicates  — tìm trùng MSSV
  GET  /reconcile/report/{job_id}  — lấy báo cáo
"""

from __future__ import annotations

import uuid
import logging
from typing import Any, Dict, List, Optional
from difflib import SequenceMatcher

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

# ── In-memory report store ────────────────────────────────────────────────────
_reports: Dict[str, Dict[str, Any]] = {}


# ── Pydantic models ───────────────────────────────────────────────────────────

class StudentRow(BaseModel):
    mssv: Optional[str] = None
    ho_ten: Optional[str] = None
    lop: Optional[str] = None
    diem_qp: Optional[float] = None
    ket_qua: Optional[str] = None
    ghi_chu: Optional[str] = None


class ReconcileRequest(BaseModel):
    """Compare two lists of student records."""
    decision_id: str
    source_a: List[StudentRow] = []   # e.g. bảng điểm
    source_b: List[StudentRow] = []   # e.g. quyết định
    label_a: str = "Bảng điểm"
    label_b: str = "Quyết định"


class DecisionCompareRequest(BaseModel):
    """Compare bảng điểm vs quyết định by document IDs."""
    bang_diem_records: List[StudentRow] = []
    quyet_dinh_names: List[str] = []   # Danh sách họ tên từ quyết định
    label_a: str = "Bảng điểm"
    label_b: str = "Quyết định"


class DuplicateRequest(BaseModel):
    records: List[StudentRow] = []


# ── Similarity helpers ────────────────────────────────────────────────────────

def _name_sim(a: str, b: str) -> float:
    """Fuzzy name similarity (SequenceMatcher, normalised)."""
    a, b = a.strip().lower(), b.strip().lower()
    return SequenceMatcher(None, a, b).ratio()


def _normalise_mssv(mssv: str) -> str:
    return mssv.strip().upper().replace(" ", "")


# ── Core comparison logic ─────────────────────────────────────────────────────

def _compare_lists(
    a: List[StudentRow],
    b: List[StudentRow],
    label_a: str,
    label_b: str,
) -> Dict[str, Any]:
    """
    Full comparison between two student lists.
    Returns matched, only_in_a, only_in_b, conflicts.
    """
    # Index list B by MSSV
    b_by_mssv: Dict[str, StudentRow] = {}
    b_unmatched: set[int] = set(range(len(b)))
    for i, row in enumerate(b):
        if row.mssv:
            b_by_mssv[_normalise_mssv(row.mssv)] = row
            b_unmatched.discard(i)   # will re-add if unmatched

    matched: List[Dict] = []
    conflicts: List[Dict] = []
    only_in_a: List[Dict] = []
    b_matched_keys: set[str] = set()

    for row_a in a:
        key = _normalise_mssv(row_a.mssv or "")
        if key and key in b_by_mssv:
            row_b = b_by_mssv[key]
            b_matched_keys.add(key)
            issues: List[str] = []

            # Name mismatch
            if row_a.ho_ten and row_b.ho_ten:
                sim = _name_sim(row_a.ho_ten, row_b.ho_ten)
                if sim < 0.80:
                    issues.append(
                        f"Họ tên khác: '{row_a.ho_ten}' ≠ '{row_b.ho_ten}' (tương đồng {sim:.0%})"
                    )

            # Score / result mismatch
            if row_a.ket_qua and row_b.ket_qua and row_a.ket_qua != row_b.ket_qua:
                issues.append(f"Kết quả khác: '{row_a.ket_qua}' ≠ '{row_b.ket_qua}'")

            if row_a.diem_qp is not None and row_b.diem_qp is not None:
                if abs(row_a.diem_qp - row_b.diem_qp) > 0.1:
                    issues.append(
                        f"Điểm khác: {row_a.diem_qp} ≠ {row_b.diem_qp}"
                    )

            # Class mismatch
            if row_a.lop and row_b.lop and row_a.lop.strip().upper() != row_b.lop.strip().upper():
                issues.append(f"Lớp khác: '{row_a.lop}' ≠ '{row_b.lop}'")

            entry = {
                "mssv": key,
                "ho_ten": row_a.ho_ten,
                label_a: row_a.model_dump(),
                label_b: row_b.model_dump(),
            }
            if issues:
                entry["issues"] = issues
                conflicts.append(entry)
            else:
                matched.append(entry)
        else:
            # In A but not in B
            only_in_a.append({
                "mssv": row_a.mssv,
                "ho_ten": row_a.ho_ten,
                "diem_qp": row_a.diem_qp,
                "ket_qua": row_a.ket_qua,
                "reason": f"Có trong {label_a}, không có trong {label_b}",
            })

    # In B but not matched with A
    only_in_b: List[Dict] = []
    for row_b in b:
        key = _normalise_mssv(row_b.mssv or "")
        if key and key not in b_matched_keys:
            only_in_b.append({
                "mssv": row_b.mssv,
                "ho_ten": row_b.ho_ten,
                "reason": f"Có trong {label_b}, không có trong {label_a}",
            })

    total = len(a)
    summary = {
        "tong_a": len(a),
        "tong_b": len(b),
        "khop": len(matched),
        "xung_dot": len(conflicts),
        "chi_trong_a": len(only_in_a),
        "chi_trong_b": len(only_in_b),
        "do_chinh_xac": (
            round(len(matched) / total * 100, 1) if total > 0 else 0.0
        ),
    }

    return {
        "summary": summary,
        "matched": matched,
        "conflicts": conflicts,
        "only_in_a": only_in_a,
        "only_in_b": only_in_b,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/compare")
async def compare(request: ReconcileRequest):
    """
    So sánh hai danh sách sinh viên (bảng điểm ↔ quyết định).
    Trả về: khớp / xung đột / thiếu.
    """
    try:
        logger.info(
            f"Reconcile: decision={request.decision_id} "
            f"a={len(request.source_a)} b={len(request.source_b)}"
        )
        result = _compare_lists(
            request.source_a,
            request.source_b,
            request.label_a,
            request.label_b,
        )
        job_id = f"rec_{uuid.uuid4().hex[:8]}"
        _reports[job_id] = result
        return {"success": True, "job_id": job_id, **result}
    except Exception as exc:
        logger.error(f"Reconcile error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/compare-decision")
async def compare_decision(request: DecisionCompareRequest):
    """
    So sánh bảng điểm với danh sách họ tên từ quyết định.
    (Dùng khi QĐ chỉ có họ tên, không có MSSV.)
    """
    try:
        results: List[Dict] = []
        qd_names_lower = [n.strip().lower() for n in request.quyet_dinh_names]

        for row in request.bang_diem_records:
            name = (row.ho_ten or "").strip().lower()
            # Find best match in QD list
            best_sim = 0.0
            best_qd = ""
            for qd_name in qd_names_lower:
                sim = _name_sim(name, qd_name)
                if sim > best_sim:
                    best_sim = sim
                    best_qd = qd_name

            status: str
            if best_sim >= 0.90:
                status = "Khớp"
            elif best_sim >= 0.70:
                status = "Gần đúng"
            else:
                status = "Không tìm thấy"

            results.append({
                "mssv": row.mssv,
                "ho_ten_bang_diem": row.ho_ten,
                "ho_ten_quyet_dinh": best_qd if best_sim >= 0.70 else None,
                "diem_qp": row.diem_qp,
                "ket_qua_bang_diem": row.ket_qua,
                "do_tuong_dong": round(best_sim * 100, 1),
                "trang_thai": status,
            })

        matched_count = sum(1 for r in results if r["trang_thai"] == "Khớp")
        fuzzy_count = sum(1 for r in results if r["trang_thai"] == "Gần đúng")
        missing_count = sum(1 for r in results if r["trang_thai"] == "Không tìm thấy")

        summary = {
            "tong_bang_diem": len(request.bang_diem_records),
            "tong_quyet_dinh": len(request.quyet_dinh_names),
            "khop_chinh_xac": matched_count,
            "khop_gan_dung": fuzzy_count,
            "khong_tim_thay": missing_count,
            "do_chinh_xac": (
                round(matched_count / len(results) * 100, 1) if results else 0.0
            ),
        }

        job_id = f"dec_{uuid.uuid4().hex[:8]}"
        report = {"summary": summary, "records": results}
        _reports[job_id] = report
        return {"success": True, "job_id": job_id, **report}

    except Exception as exc:
        logger.error(f"compare-decision error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/find-duplicates")
async def find_duplicates(request: DuplicateRequest):
    """
    Tìm các MSSV hoặc họ tên bị trùng lặp trong cùng một danh sách.
    """
    seen_mssv: Dict[str, List[int]] = {}
    seen_names: Dict[str, List[int]] = {}

    for i, row in enumerate(request.records):
        if row.mssv:
            key = _normalise_mssv(row.mssv)
            seen_mssv.setdefault(key, []).append(i)
        if row.ho_ten:
            key = row.ho_ten.strip().lower()
            seen_names.setdefault(key, []).append(i)

    dup_mssv = [
        {"mssv": k, "indices": v, "count": len(v)}
        for k, v in seen_mssv.items() if len(v) > 1
    ]
    dup_names = [
        {"ho_ten": k, "indices": v, "count": len(v)}
        for k, v in seen_names.items() if len(v) > 1
    ]

    return {
        "success": True,
        "trung_mssv": dup_mssv,
        "trung_ho_ten": dup_names,
        "tong_trung_mssv": len(dup_mssv),
        "tong_trung_ten": len(dup_names),
    }


@router.get("/report/{job_id}")
async def get_report(job_id: str):
    """Lấy báo cáo đối chiếu đã lưu."""
    report = _reports.get(job_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "job_id": job_id, **report}

