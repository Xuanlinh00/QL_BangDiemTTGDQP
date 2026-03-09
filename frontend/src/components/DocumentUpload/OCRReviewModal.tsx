/**
 * OCRReviewModal — Side-by-side PDF viewer + editable extracted data.
 *
 * Layout:
 *   ┌─────────────────────────┬───────────────────────────┐
 *   │  📄 PDF Viewer (iframe) │  📊 Editable Data Table   │
 *   │  (left 50%)             │  (right 50%)              │
 *   └─────────────────────────┴───────────────────────────┘
 *
 * Workflow:
 *   1. Parent provides a pdfUrl (blob URL or Drive embed URL)
 *      and the raw OCR text.
 *   2. This component calls the Python worker to parse the text.
 *   3. User reviews / corrects each field inline.
 *   4. "Lưu xác nhận" emits the corrected records back to the parent.
 *   5. Parent can then call /export/excel to download the workbook.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { PdfExtractResult, extractFromBlob } from '../../utils/pdfExtract'
import PDFViewer from './PDFViewer'
import { exportPdfFormatToExcel } from '../../utils/excelExport'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StudentRecord {
  stt: string
  ho_ten: string
  mssv: string
  lop: string
  diem_qp: string
  diem_lan2: string
  ket_qua: string
  ghi_chu: string
}

export interface ExtractMeta {
  lop?: string
  mon_hoc?: string
  total_records?: number
  diem_trung_binh?: number
  so_dat?: number
  so_khong_dat?: number
  ty_le_dat?: number
  [key: string]: unknown
}

interface Props {
  isOpen: boolean
  onClose: () => void
  /** Left panel — a URL that can be embedded in an <iframe> */
  pdfUrl: string | null
  docName: string
  docId: string
  docType: 'DSGD' | 'QD' | 'BieuMau'
  /** Raw OCR text already extracted client-side (optional).
   *  When provided, the component skips OCR and goes straight to extraction. */
  rawText?: string
  /** Local file blob — nếu có, modal sẽ tự đọc nội dung PDF ngay trong trình duyệt */
  fileBlob?: Blob | null
  /** The Python worker base URL (default: http://localhost:8000) */
  workerUrl?: string
  onSave?: (records: StudentRecord[], meta: ExtractMeta) => void
}

// ── OCR Demo text (used when no rawText is provided and worker unreachable) ──

const DEMO_RECORDS: StudentRecord[] = [
  { stt: '1', ho_ten: 'Nguyễn Văn An',   mssv: 'DA210001', lop: 'DA21TYC', diem_qp: '7.5', diem_lan2: '', ket_qua: 'Đạt',       ghi_chu: '' },
  { stt: '2', ho_ten: 'Trần Thị Bình',   mssv: 'DA210002', lop: 'DA21TYC', diem_qp: '8.0', diem_lan2: '', ket_qua: 'Đạt',       ghi_chu: '' },
  { stt: '3', ho_ten: 'Lê Quốc Cường',   mssv: 'DA210003', lop: 'DA21TYC', diem_qp: '4.5', diem_lan2: '', ket_qua: 'Không đạt', ghi_chu: '' },
  { stt: '4', ho_ten: 'Phạm Hoàng Dũng',  mssv: 'DA210004', lop: 'DA21TYC', diem_qp: '6.0', diem_lan2: '', ket_qua: 'Đạt',       ghi_chu: '' },
  { stt: '5', ho_ten: 'Hoàng Thị Ê',     mssv: 'DA210005', lop: 'DA21TYC', diem_qp: '9.0', diem_lan2: '', ket_qua: 'Đạt',       ghi_chu: '' },
  { stt: '6', ho_ten: 'Vũ Ngọc Phúc',    mssv: 'DA210006', lop: 'DA21TYC', diem_qp: '5.5', diem_lan2: '', ket_qua: 'Đạt',       ghi_chu: '' },
  { stt: '7', ho_ten: 'Đặng Minh Quân',  mssv: 'DA210007', lop: 'DA21TYC', diem_qp: '3.0', diem_lan2: '', ket_qua: 'Không đạt', ghi_chu: '' },
  { stt: '8', ho_ten: 'Bùi Thị Hương',   mssv: 'DA210008', lop: 'DA21TYC', diem_qp: '7.0', diem_lan2: '', ket_qua: 'Đạt',       ghi_chu: '' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

// ── Module-level: tránh gọi backend lặp lại khi đã biết offline ─────────────
// Dùng cả module var (nhanh, luôn hoạt động) + sessionStorage (sống qua HMR)
const _SS_OFFLINE_KEY = 'tvu_backend_offline_ts'
const BACKEND_RETRY_MS = 60_000
let _moduleOfflineTs = 0   // reset khi HMR, nhưng sessionStorage sẽ khôi phục

function isBackendKnownOffline(): boolean {
  // Fast path: module var (trong cùng 1 JS module instance)
  if (_moduleOfflineTs > 0 && Date.now() - _moduleOfflineTs < BACKEND_RETRY_MS) return true
  // HMR-proof path: sessionStorage (nếu module var đã bị reset bởi HMR)
  try {
    const ts = Number(sessionStorage.getItem(_SS_OFFLINE_KEY) ?? 0)
    if (ts > 0 && Date.now() - ts < BACKEND_RETRY_MS) {
      _moduleOfflineTs = ts  // đồng bộ lại module var
      return true
    }
  } catch { /* sessionStorage blocked (private mode): dùng module var */ }
  return false
}
function markBackendOffline(): void {
  _moduleOfflineTs = Date.now()
  try { sessionStorage.setItem(_SS_OFFLINE_KEY, String(_moduleOfflineTs)) } catch { /* ignore */ }
}
function markBackendOnline(): void {
  _moduleOfflineTs = 0
  try { sessionStorage.removeItem(_SS_OFFLINE_KEY) } catch { /* ignore */ }
}

// ── Module-level: dedup xử lý file — sống qua HMR nhờ sessionStorage + module var ──
const _SS_JOB_KEY = 'tvu_ocr_job'
const JOB_TTL_MS = 5 * 60_000
let _currentJobId = ''   // module-level fast path
function _blobJobId(blob: Blob): string {
  const name = (blob as File).name ?? ''
  const lm   = (blob as File).lastModified ?? 0
  return `${blob.size}:${lm}:${name}`
}
function isJobAlreadyRunning(blob: Blob): boolean {
  const id = _blobJobId(blob)
  if (_currentJobId === id) return true
  try {
    const data = JSON.parse(sessionStorage.getItem(_SS_JOB_KEY) ?? 'null')
    if (data?.id === id && Date.now() - data.ts < JOB_TTL_MS) {
      _currentJobId = id
      return true
    }
  } catch { /* ignore */ }
  return false
}
function markJobRunning(blob: Blob): void {
  _currentJobId = _blobJobId(blob)
  try {
    sessionStorage.setItem(_SS_JOB_KEY, JSON.stringify({ id: _currentJobId, ts: Date.now() }))
  } catch { /* ignore */ }
}
function clearRunningJob(): void {
  _currentJobId = ''
  try { sessionStorage.removeItem(_SS_JOB_KEY) } catch { /* ignore */ }
}

function computeKetQua(score: string): string {
  const n = parseFloat(score.replace(',', '.'))
  if (isNaN(n)) return ''
  return n >= 5.0 ? 'Đạt' : 'Không đạt'
}

function computeMeta(records: StudentRecord[]): ExtractMeta {
  const scores = records.map(r => parseFloat(r.diem_qp.replace(',', '.'))).filter(n => !isNaN(n))
  if (!scores.length) return { total_records: records.length }
  const sodat = scores.filter(s => s >= 5).length
  return {
    total_records: records.length,
    diem_trung_binh: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
    so_dat: sodat,
    so_khong_dat: scores.length - sodat,
    ty_le_dat: Math.round((sodat / scores.length) * 1000) / 10,
  }
}

function recordsToApiShape(records: StudentRecord[]) {
  return records.map(r => ({
    ...r,
    diem_qp: r.diem_qp === '' ? null : parseFloat(r.diem_qp.replace(',', '.')),
    diem_lan2: r.diem_lan2 === '' ? null : parseFloat(r.diem_lan2.replace(',', '.')),
  }))
}

// ── OCR text normalizer: sửa lỗi nhận dạng phổ biến của Tesseract ────────────
function normalizeOcrText(raw: string): string {
  let text = raw.replace(/\r/g, '')
  // Sửa O/o/Q → 0 khi kẹp giữa 2 chữ số (OCR nhầm 0 vs O)
  text = text.replace(/(\d)[OoQq](\d)/g, '$10$2')
  // Sửa l/I/| → 1 khi kẹp giữa 2 chữ số
  text = text.replace(/(\d)[lI|](\d)/g, '$11$2')
  // Sửa dấu thập phân bị tách: "9 . 8" → "9.8"
  // Chú ý: KHÔNG áp dụng khi → tạo thành ngày/tháng (dd/mm)
  text = text.replace(/(\d)\s*[.,]\s*(\d)/g, (m, a, b) => {
    // Nếu là phân cách ngày: ký tự trước là '/' hoặc '\n' → giữ nguyên
    return `${a}.${b}`
  })
  // Ghép chuỗi số bị tách 1–2 cách TRONG CÙNG 1 DÒN để khôi phục MSSV
  // NHƯNG chỉ ghép khi kết quả KHÔNG phải ngày sinh (không có dấu / ở kề bên)
  // và kết quả có độ dài hợp lệ MSSV (7-10 chữ số)
  // Dùng chiến lược: ghép trong mỗi «cụm số»  (không qua dấu / - khoảng cách lớn)
  text = text.replace(/\b(\d) {1,2}(\d)/g, (full, a, b, offset, src) => {
    // Không ghép nếu xung quanh có ký tự / hoặc - (dấu ngày tháng)
    const before = src[offset - 1] ?? ''
    const after  = src[offset + full.length] ?? ''
    if (before === '/' || before === '-' || after === '/' || after === '-') return full
    return `${a}${b}`
  })
  // Xóa ký tự nhiễu đầu dòng từ Tesseract
  text = text.replace(/^[\[\]{}|\\<>@#$%^&*~`]+/gm, '')
  return text
}

// ── Primary parser: column-split + token-fallback ─────────────────────────────
// Strategy:
//  Pass 1 – split line on 2+ spaces → structured column parse
//  Pass 2 – if MSSV not found in cols → scan all single-space tokens
//            (handles tight-table PDFs where column gaps < 0.45 em)
//  Supports both column orders:
//   A) STT  NAME  MSSV  CLASS  SCORES
//   B) STT  MSSV  NAME  DATE  GENDER  SCORES  (TVU "Danh Sach Ghi Diem")
function parseRecordsFromColumnText(
  rawText: string,
  docType: string,
): { records: StudentRecord[]; meta: ExtractMeta } | null {
  if (docType !== 'DSGD') return null

  // TVU MSSV: 9-digit starting with 1 (110122001), prefixed (DA210001), or 7-10 plain digits
  const MSSV_RE      = /^([A-Z]{0,3}\d{5,12}|1\d{8}|\d{7,10})$/
  const SCORE_RE_TOK = /^(10(?:[.,]\d{1,2})?|[0-9](?:[.,]\d{1,2})?)$/
  const SCORE_INLINE = /\b(10(?:[.,]\d{1,2})?|[0-9](?:[.,]\d{1,2})?)\b/g
  const LOP_RE       = /^[A-Z]{1,4}\d{2}[A-Z][A-Z0-9]{0,10}$/
  const STT_RE       = /^\d{1,3}$/
  const DATE_RE_TOK  = /^\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?$/
  const DATE_INLINE  = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/
  const VIET_CAP     = /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẮẶẰẲẴẺẼẾỀỂỄỆỈỊỌỘỒỔỖỚỜỞỠỢỤỦỨỪỮỰỲỴỶỸ]/

  // Extract doc-level metadata
  // "Nhóm/Lớp: (01 - 02)/DA22TTA"  OR  "Lớp: DA21TYC"
  const lopMeta = (
    rawText.match(/(?:Nhóm\/Lớp|NHÓM\/LỚP)[\s:()\d\- ]*\/\s*([A-Z0-9]{4,20})/i)
    ?? rawText.match(/(?:MÃ\s+LỚP|LỚP)[:\s]+([A-Z0-9]{2,20})/i)
  )?.[1]?.trim() ?? ''
  const monMeta = rawText.match(/(?:Học phần|HỌC PHẦN|MÔN)[:\s]+(.{5,80}?)(?:\n|$)/im)?.[1]?.trim() ?? ''

  function isNameTok(tok: string): boolean {
    if (!VIET_CAP.test(tok)) return false
    if (MSSV_RE.test(tok) || LOP_RE.test(tok) || DATE_RE_TOK.test(tok)) return false
    if (SCORE_RE_TOK.test(tok.replace(',', '.'))) return false
    if (STT_RE.test(tok)) return false
    if (/^(Nam|Nữ|Phái|KT|TB|QT|Phòng|TT|HP|Lần|QP|AN|GDQP|CBGD|CBCT|ĐT|ĐH|CĐ)$/i.test(tok)) return false
    return true
  }

  const lines = rawText.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(l => l.length > 1)
  const records: StudentRecord[] = []
  const seenMssv = new Set<string>()

  for (const line of lines) {
    if (/^(STT|TT\b|HỌ\b|TÊN\b|MSSV|MÃ\s*SV|LỚP|ĐIỂM|KẾT|GHI|===|TRANG|BẢNG|DANH|TRƯỜNG|BỘ|KHOA|MÔN|MÃ\b|NGÀY|HỘI\s*ĐỒNG)/i.test(line)) continue

    // Pass 1: 2+-space column split
    const cols = line.split(/\s{2,}/).map(c => c.trim()).filter(Boolean)
    let mssvIdx = -1
    for (let i = 0; i < cols.length; i++) {
      if (MSSV_RE.test(cols[i]) && !/^(19|20)\d{2}$/.test(cols[i])) { mssvIdx = i; break }
    }

    // Pass 2: single-space token fallback
    let mssvViaToken = ''
    if (mssvIdx < 0) {
      for (const tok of line.split(/\s+/)) {
        if (MSSV_RE.test(tok) && !/^(19|20)\d{2}$/.test(tok)) {
          if (tok.length < 7 && /^\d+$/.test(tok)) continue
          mssvViaToken = tok; break
        }
      }
      if (!mssvViaToken) continue
    }

    const mssv = mssvIdx >= 0 ? cols[mssvIdx] : mssvViaToken
    if (seenMssv.has(mssv)) continue
    seenMssv.add(mssv)

    let ho_ten = '', lop = lopMeta
    const allScores: number[] = []
    let ghi_chu = ''

    if (mssvIdx >= 0) {
      const hasStt = STT_RE.test(cols[0])
      const ns = hasStt ? 1 : 0
      ho_ten = cols.slice(ns, mssvIdx).filter(isNameTok).join(' ').trim()
      if (!ho_ten) {
        const parts: string[] = []
        for (let i = mssvIdx + 1; i < cols.length; i++) {
          if (isNameTok(cols[i])) parts.push(cols[i])
          else if (!DATE_RE_TOK.test(cols[i])) break
        }
        ho_ten = parts.join(' ').trim()
      }
      for (let i = mssvIdx + 1; i < cols.length; i++) {
        if (SCORE_RE_TOK.test(cols[i].replace(',', '.'))) {
          const n = parseFloat(cols[i].replace(',', '.'))
          if (!isNaN(n)) allScores.push(n)
        }
      }
      if (!lop) for (const c of cols) { if (LOP_RE.test(c) && c !== mssv) { lop = c; break } }
      if (allScores.length >= 3) {
        for (let i = cols.length - 1; i > mssvIdx; i--) {
          const c = cols[i]
          if (!SCORE_RE_TOK.test(c.replace(',', '.')) && !DATE_RE_TOK.test(c) && isNaN(parseFloat(c))) { ghi_chu = c; break }
        }
      }
    } else {
      const mssvPos   = line.indexOf(mssv)
      const beforeTxt = line.slice(0, mssvPos).replace(/^\s*\d{1,3}[\s.)]*/, '').trim()
      const afterTxt  = line.slice(mssvPos + mssv.length).trim()
      ho_ten = beforeTxt.split(/\s+/).filter(isNameTok).join(' ')
      if (!ho_ten) {
        const dateM  = afterTxt.match(DATE_INLINE)
        SCORE_INLINE.lastIndex = 0
        const scoreM = SCORE_INLINE.exec(afterTxt)
        const cut    = Math.min(
          dateM  ? (dateM.index ?? Infinity) : Infinity,
          scoreM ? (scoreM.index ?? Infinity) : Infinity,
        )
        const nameSec = isFinite(cut) ? afterTxt.slice(0, cut) : afterTxt
        ho_ten = nameSec.split(/\s+/).filter(isNameTok).join(' ')
      }
      SCORE_INLINE.lastIndex = 0
      let sm: RegExpExecArray | null
      while ((sm = SCORE_INLINE.exec(afterTxt)) !== null) {
        const pre = afterTxt[sm.index - 1]
        if (pre === '/' || pre === '-') continue
        const n = parseFloat(sm[1].replace(',', '.'))
        if (!isNaN(n)) allScores.push(n)
      }
      if (!lop) for (const t of line.split(/\s+/)) { if (LOP_RE.test(t) && t !== mssv) { lop = t; break } }
    }

    let dq: number | null = null, dl: number | null = null
    if (allScores.length >= 3)       dq = allScores[allScores.length - 1]
    else if (allScores.length === 2) { dq = allScores[0]; if (allScores[1] > 0) dl = allScores[1] }
    else if (allScores.length === 1)  dq = allScores[0]

    records.push({
      stt:       mssvIdx >= 0 && STT_RE.test(cols[0]) ? cols[0] : String(records.length + 1),
      ho_ten:    ho_ten.trim(),
      mssv,
      lop,
      diem_qp:   dq !== null ? String(dq) : '',
      diem_lan2: dl !== null ? String(dl) : '',
      ket_qua:   dq !== null ? (dq >= 5 ? 'Đạt' : 'Không đạt') : '',
      ghi_chu,
    })
  }

  if (records.length === 0) return null
  const meta = computeMeta(records)
  if (lopMeta) meta.lop = lopMeta
  if (monMeta) meta.mon_hoc = monMeta
  return { records, meta }
}

// ── Client-side parser (fallback when Python worker is unreachable) ──────────
// Extracts student records from raw PDF text without server round-trip.
function parseRecordsClientSide(
  rawText: string,
  docType: string,
): { records: StudentRecord[]; meta: ExtractMeta } | null {
  if (docType !== 'DSGD') return null

  const normalised = normalizeOcrText(rawText)

  const lines = normalised
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 1)

  // MSSV TVU: 9 chữ số bắt đầu bằng 1 (vd: 110122001), hoặc prefixed (DA210001)
  // Không khớp năm sinh (2004, 1990...) hay ngày sinh (27/10/2004)
  // min 7 digits để tránh STT / số phòng
  const MSSV_RE = /\b([A-Z]{1,3}\d{5,10}|1\d{8}|\d{7,10})\b/g

  // Vietnamese name: 2-5 capitalised words (ASCII + accented)
  const VIET_CAP =
    '[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẮẶẰẲẴẺẼẾỀỂỄỆỈỊỌỘỒỔỖỚỜỞỠỢỤỦỨỪỮỰỲỴỶỸ]'
  const VIET_LC =
    '[a-zàáâãèéêìíòóôõùúăđĩũơưắặằẳẵẻẽếềểễệỉịọộồổỗớờởỡợụủứừữựỳỵỷỹ]'
  const WORD = `${VIET_CAP}${VIET_LC}+`
  const NAME_RE = new RegExp(`${WORD}(?:\\s+${WORD}){1,4}`, 'g')

  // Score in range 0-10 (e.g. 7.5, 10, 4, 8.0)
  const SCORE_RE = /\b(10(?:\.0{1,2})?|\d(?:[.,]\d{1,2})?)\b/g

  // Class code: looks like DA21TYC, DT20A, etc.
  const LOP_RE = /\b([A-Z]{1,3}\d{2}[A-Z]{2,}[A-Z0-9]*)\b/g

  // Words to skip in name detection
  const SKIP_NAME = /^(Trà|Vinh|Giáo|Quốc|Phòng|Trường|Nhà|Nước|Hội|Đại|Học|Thi|Kết|Bảng|Danh|Sách|Môn|Phần|Lớp|Ngày|Tháng|Năm|Khoa|Viện|Ban|Ông|Bà|Anh|Chị)/i

  const records: StudentRecord[] = []
  const seenMssv = new Set<string>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip header/footer lines
    if (/^(STT|HỌ|TÊN|MSSV|LỚP|ĐIỂM|KẾT|GHI|===|TRANG|BẢNG|DANH|TRƯỜNG|BỘ|KHOA)/i.test(line)) continue

    MSSV_RE.lastIndex = 0
    const mssvM = MSSV_RE.exec(line)
    if (!mssvM) continue

    const mssv = mssvM[1]
    // Skip years and common 4-digit codes
    if (/^(19|20)\d{2}$/.test(mssv)) continue
    if (seenMssv.has(mssv)) continue
    seenMssv.add(mssv)

    // Context: current ± 1 adjacent line
    const ctx = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join(' ')

    // ── Name ───────────────────────────────────────────────────────────────
    NAME_RE.lastIndex = 0
    const nameMatches: string[] = []
    let nm: RegExpExecArray | null
    while ((nm = NAME_RE.exec(ctx)) !== null) {
      const w = nm[0].trim()
      if (SKIP_NAME.test(w)) continue
      if (w.split(' ').length < 2) continue
      if (w === mssv) continue
      nameMatches.push(w)
    }
    const ho_ten = nameMatches[0] ?? ''

    // ── Class ──────────────────────────────────────────────────────────────
    LOP_RE.lastIndex = 0
    let lop = ''
    let lm: RegExpExecArray | null
    while ((lm = LOP_RE.exec(ctx)) !== null) {
      if (lm[1] !== mssv) { lop = lm[1]; break }
    }

    // ── Scores (look only on current + next line) ──────────────────────────
    const scoreCtx = lines.slice(i, Math.min(lines.length, i + 2)).join(' ')
    SCORE_RE.lastIndex = 0
    const scores: number[] = []
    let sm: RegExpExecArray | null
    while ((sm = SCORE_RE.exec(scoreCtx)) !== null) {
      const n = parseFloat(sm[1].replace(',', '.'))
      if (!isNaN(n) && n >= 0 && n <= 10) scores.push(n)
    }
    const dq = scores[0] ?? null
    const dl = scores[1] ?? null

    records.push({
      stt: String(records.length + 1),
      ho_ten,
      mssv,
      lop,
      diem_qp: dq !== null ? String(dq) : '',
      diem_lan2: dl !== null ? String(dl) : '',
      ket_qua: dq !== null ? (dq >= 5 ? 'Đạt' : 'Không đạt') : '',
      ghi_chu: '',
    })
  }

  if (records.length === 0) return null
  return { records, meta: computeMeta(records) }
}

/**
 * Parser dự phòng: tìm rows bằng số thứ tự (1, 2, 3...)
 * Dùng khi OCR bị sai ký tự còn MSSV không nhận ra.
 */
function parseRecordsByRowNumber(
  rawText: string,
): { records: StudentRecord[]; meta: ExtractMeta } | null {
  const lines = rawText
    .replace(/\r/g, '')
    .replace(/(\d) (\d)/g, '$1$2')  // chỉ ghép khi cách 1 dấu cách
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 1)

  // Tìm dòng bắt đầu bằng số thứ tự: "1", "1.", "1 " kèm nội dung
  const ROW_RE = /^(\d{1,3})[.)\s]\s*(.+)/
  const MSSV_ROW_RE = /\b(1\d{8}|\d{8,10}|[A-Z]{1,3}\d{5,10})\b/
  const SCORE_RE = /\b(10(?:\.0{1,2})?|[0-9](?:[.,]\d{1,2})?)\b/g

  const records: StudentRecord[] = []
  let expectedStt = 1

  for (const line of lines) {
    const m = ROW_RE.exec(line)
    if (!m) continue
    const sttNum = parseInt(m[1], 10)
    // Chỉ nhận số thứ tự liên tiếp (tránh nhận số ngẫu nhiên)
    if (sttNum !== expectedStt && sttNum !== expectedStt + 1) continue
    expectedStt = sttNum + 1

    const rest = m[2].trim()
    // Tách các token bằng khoảng trắng ≥2 hoặc tab
    const tokens = rest.split(/\s{2,}|\t/).map(t => t.trim()).filter(Boolean)

    // Thu thập điểm số
    SCORE_RE.lastIndex = 0
    const scores: number[] = []
    let sm: RegExpExecArray | null
    while ((sm = SCORE_RE.exec(rest)) !== null) {
      const n = parseFloat(sm[1].replace(',', '.'))
      if (!isNaN(n) && n >= 0 && n <= 10) scores.push(n)
    }

    // Tìm MSSV trực tiếp bằng regex trong cả dòng (không phụ thuộc vào tách token)
    const mssvMatch = MSSV_ROW_RE.exec(rest)
    const mssv = mssvMatch?.[1] ?? tokens.find(t => /^[A-Za-z0-9]{5,15}$/.test(t) && !/^[A-Za-z]{1,3}$/.test(t)) ?? ''

    // Tên: lấy phần văn bản TRƯỚC MSSV trong dòng (đáng tin hơn là dùng token)
    let ho_ten = ''
    if (mssv) {
      const mssvIdx = rest.indexOf(mssv)
      if (mssvIdx > 0) {
        // Lấy phần trước MSSV, loại bỏ STT đầu dòng (1-3 chữ số)
        ho_ten = rest.slice(0, mssvIdx).replace(/^\d{1,3}[\s.)\-]*/, '').trim()
      }
    }
    if (!ho_ten) {
      ho_ten = tokens.find(t => /[a-zA-ZÀ-ỹ]{2}/.test(t) && !/^\d+$/.test(t) && t !== mssv) ?? ''
    }

    // Lớp: dạng 2-4 chữ hoa + 2 số + ít nhất 1 chữ hoa (vd: DA21TYC, DT20A, CC21A2)
    const lop = tokens.find(t => /^[A-Z]{1,4}\d{2}[A-Z][A-Z0-9]*$/.test(t) && t !== mssv) ?? ''

    const dq = scores[0] ?? null
    const dl = scores[1] ?? null

    records.push({
      stt: String(sttNum),
      ho_ten,
      mssv,
      lop,
      diem_qp:  dq !== null ? String(dq) : '',
      diem_lan2: dl !== null ? String(dl) : '',
      ket_qua:  dq !== null ? (dq >= 5 ? 'Đạt' : 'Không đạt') : '',
      ghi_chu: '',
    })
  }

  if (records.length < 2) return null
  return { records, meta: computeMeta(records) }
}

// ── Helper: chuyển Blob → data URL (để Tesseract.js nhận ảnh) ─────────────────
/**
 * Render tất cả trang PDF ra 1 canvas dọc → PNG data URL cho Tesseract.
 * Ghép nhiều trang giúp OCR nhận đủ dữ liệu bảng trải dài nhiều trang.
 */
async function blobToImageDataUrl(blob: Blob): Promise<string> {
  try {
    const { pdfjs } = await import('react-pdf')
    const ab = await blob.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise
    const SCALE = 2.0

    // Render từng trang ra canvas riêng
    const pageCanvases: HTMLCanvasElement[] = []
    for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) { // tối đa 5 trang
      const page = await pdf.getPage(i)
      const vp = page.getViewport({ scale: SCALE })
      const c = document.createElement('canvas')
      c.width = vp.width
      c.height = vp.height
      await page.render({ canvasContext: c.getContext('2d')!, viewport: vp }).promise
      pageCanvases.push(c)
    }

    if (pageCanvases.length === 0) throw new Error('no pages')
    if (pageCanvases.length === 1) return pageCanvases[0].toDataURL('image/jpeg', 0.85)

    // Ghép tất cả trang theo chiều dọc
    const totalWidth  = Math.max(...pageCanvases.map(c => c.width))
    const totalHeight = pageCanvases.reduce((s, c) => s + c.height, 0)
    const merged = document.createElement('canvas')
    merged.width  = totalWidth
    merged.height = totalHeight
    const mCtx = merged.getContext('2d')!
    let y = 0
    for (const c of pageCanvases) { mCtx.drawImage(c, 0, y); y += c.height }
    return merged.toDataURL('image/jpeg', 0.85)
  } catch {
    return URL.createObjectURL(blob)
  }
}

// ── Canvas preprocessing for handwritten/scanned PDFs ────────────────────────
// Uses Otsu's adaptive thresholding — much better than fixed thresholds for
// faint or uneven handwriting on varied paper backgrounds.
function preprocessCanvasForOCR(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = imageData.data
  const n = d.length >>> 2  // pixel count

  // Step 1: grayscale + build histogram
  const gray = new Uint8Array(n)
  const hist = new Uint32Array(256)
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])
    gray[j] = g
    hist[g]++
  }

  // Step 2: Otsu's method — find threshold that maximises inter-class variance
  let sumAll = 0
  for (let i = 0; i < 256; i++) sumAll += i * hist[i]
  let best = 0, thresh = 128, sumB = 0, wB = 0
  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = n - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sumAll - sumB) / wF
    const between = wB * wF * (mB - mF) ** 2
    if (between > best) { best = between; thresh = t }
  }

  // Step 3: binarise — pixels below Otsu threshold → black (ink), above → white (paper)
  // Add a small bias (+10) so faint ink strokes are kept as black
  const finalThresh = Math.min(thresh + 10, 240)
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const v = gray[j] <= finalThresh ? 0 : 255
    d[i] = d[i + 1] = d[i + 2] = v
  }
  ctx.putImageData(imageData, 0, 0)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OCRReviewModal({
  isOpen,
  onClose,
  pdfUrl,
  docName,
  docId,
  docType,
  rawText,
  fileBlob,
  workerUrl = 'http://localhost:8000',
  onSave,
}: Props) {
  const [step, setStep] = useState<'reading_pdf' | 'loading' | 'review' | 'saving' | 'done'>('reading_pdf')
  const [records, setRecords] = useState<StudentRecord[]>([])
  const [meta, setMeta] = useState<ExtractMeta>({})
  const [rawOcrText, setRawOcrText] = useState(rawText || '')
  const [rightTab, setRightTab] = useState<'table' | 'text'>('table')
  const [pdfReadResult, setPdfReadResult] = useState<PdfExtractResult | null>(null)
  const [readProgress, setReadProgress] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({})
  const [leftWidth, setLeftWidth] = useState(50) // percent
  const dragging = useRef(false)
  const textExtractedRef = useRef(false)   // guard: only run extraction once
  const runningRef = useRef(false)         // guard: chống StrictMode double-run

  // Bọc onClose để reset guard khi đóng modal
  const handleClose = useCallback(() => {
    runningRef.current = false
    clearRunningJob()
    onClose()
  }, [onClose])

  // ── Step 2: Extract data from OCR text — client-side only ──────────────
  const runExtract = useCallback(async (text: string) => {
    setStep('loading')
    // Try parsers from most-structured to least-structured:
    // 1. Column-split: best for text-layer PDFs (splits on 2+ spaces from pdfExtract)
    // 2. MSSV-anchor: good for mixed-format text
    // 3. Row-number: fallback for heavily garbled OCR
    const cs = parseRecordsFromColumnText(text, docType)
      ?? parseRecordsClientSide(text, docType)
      ?? parseRecordsByRowNumber(text)
    if (cs && cs.records.length > 0) {
      setRecords(cs.records)
      setMeta(cs.meta)
    } else {
      setRecords([])
      setMeta({})
      setRightTab('text')
      toast(
        text.trim().length > 20
          ? 'Không nhận ra cấu trúc bảng — xem văn bản gốc ở tab "Văn bản" →'
          : 'Không trích xuất được văn bản. Vui lòng thêm bản ghi thủ công.',
        { icon: 'ℹ️', duration: 8000 },
      )
    }
    setStep('review')
  }, [docType])

  // ── Document AI / Vision API: gửi scanned PDF lên backend → OCR ──────────
  const runDocumentAI = useCallback(async (blob: Blob) => {
    setStep('loading')
    // Nếu đã biết backend offline, bỏ qua tất cả network call
    if (isBackendKnownOffline()) {
      await runTesseractFallback(blob)
      return
    }
    try {
      const formData = new FormData()
      formData.append('file', blob, docName || 'document.pdf')
      formData.append('document_type', docType)
      formData.append('document_id', docId)

      // Thử Vision API handwriting endpoint trước (nhanh hơn, hỗ trợ chữ viết tay)
      // Nếu không cấu hình GOOGLE_APPLICATION_CREDENTIALS → fallback Document AI
      let resp: Response
      let endpointUsed = 'vision'
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 90000)

      try {
        setReadProgress('📡 Đang gửi lên Google Vision API (hỗ trợ cả chữ viết tay)...')
        resp = await fetch(`${workerUrl}/ocr/process-handwriting`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })
        if (!resp.ok) throw new Error(`Vision HTTP ${resp.status}`)
      } catch (visionErr) {
        // Vision API thất bại (bất kỳ lý do gì: network / HTTP / credentials)
        // → cả Document AI cũng trên cùng server → mark offline ngay → Tesseract
        clearTimeout(timeout)
        markBackendOffline()
        await runTesseractFallback(blob)
        return
      }
      clearTimeout(timeout)

      const data = await resp.json()
      const rawText: string = data.raw_text || ''
      setRawOcrText(rawText)

      if (endpointUsed === 'vision') {
        // Vision API trả về raw_text trực tiếp → parse thành records
        setReadProgress(`✅ Google Vision OCR: ${rawText.length} ký tự · ${data.page_count ?? 1} trang`)
        toast.success(`Vision API OCR thành công! Đọc được ${rawText.length} ký tự (hỗ trợ chữ viết tay).`)
        if (rawText.trim()) {
          await runExtract(rawText)
          return
        }
      } else {
        setReadProgress(`✅ Document AI: ${data.entities?.length ?? 0} trường · ${data.tables?.length ?? 0} bảng`)
        toast.success(`Document AI OCR thành công! ${data.entities?.length ?? 0} trường được nhận dạng`)
      }

      // Nếu Document AI trả về bảng → map trực tiếp ra records
      const tables: Array<{ headers: string[]; rows: Array<{ cells: string[] }> }> = data.tables || []
      if (tables.length > 0) {
        const firstTable = tables[0]
        const headers = firstTable.headers.map((h: string) => h.toLowerCase().trim())
        const findIdx = (...candidates: string[]) =>
          candidates.reduce((found, c) => found >= 0 ? found : headers.findIndex(h => h.includes(c)), -1)

        const idxStt   = findIdx('stt', 'số')
        const idxName  = findIdx('họ tên', 'họ và tên', 'tên')
        const idxMssv  = findIdx('mssv', 'mã số', 'mã sinh viên')
        const idxLop   = findIdx('lớp', 'class')
        const idxDiem  = findIdx('điểm', 'điểm qp', 'điểm gdqp', 'diem')
        const idxDiem2 = findIdx('lần 2', 'lan 2', 'thi lại')
        const idxKq    = findIdx('kết quả', 'ket qua', 'kq')

        const mapped: StudentRecord[] = firstTable.rows
          .filter(row => row.cells.some(c => c.trim()))
          .map((row, i) => {
            const c = row.cells
            const dq = idxDiem >= 0 ? (c[idxDiem] ?? '') : ''
            return {
              stt:      idxStt  >= 0 ? (c[idxStt]  ?? String(i + 1)) : String(i + 1),
              ho_ten:   idxName >= 0 ? (c[idxName] ?? '') : '',
              mssv:     idxMssv >= 0 ? (c[idxMssv] ?? '') : '',
              lop:      idxLop  >= 0 ? (c[idxLop]  ?? '') : '',
              diem_qp:  dq,
              diem_lan2: idxDiem2 >= 0 ? (c[idxDiem2] ?? '') : '',
              ket_qua:  idxKq   >= 0 ? (c[idxKq]   ?? computeKetQua(dq)) : computeKetQua(dq),
              ghi_chu:  '',
            }
          })

        if (mapped.length > 0) {
          setRecords(mapped)
          setMeta(computeMeta(mapped))
          setStep('review')
          return
        }
      }

      // Không có bảng → thử parse từ raw_text
      if (rawText.trim()) {
        await runExtract(rawText)
      } else {
        toast('Document AI không nhận dạng được nội dung. Vui lòng thêm bản ghi thủ công.', { icon: 'ℹ️' })
        setRecords([])
        setMeta({})
        setStep('review')
      }
    } catch (err) {
      const isOffline = err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('Failed'))
      if (isOffline) {
        markBackendOffline()
        await runTesseractFallback(blob)
      } else {
        console.error('[Document AI] error:', err)
        toast.error(`Lỗi Document AI: ${err instanceof Error ? err.message : String(err)}`)
        setRecords([])
        setMeta({})
        setStep('review')
      }
    }
  }, [docId, docName, docType, workerUrl, runExtract])

  // ── Tesseract fallback: xử lý PDF ảnh quét từng trang riêng biệt ─────────
  const runTesseractFallback = useCallback(async (blob: Blob) => {
    // 1. Thử text layer trước (nếu PDF có text)
    try {
      const { extractFromBlob } = await import('../../utils/pdfExtract')
      const result = await extractFromBlob(blob)
      if (!result.isScanned && result.text.trim().length > 20) {
        setRawOcrText(result.text)
        setReadProgress(`✅ Text layer: ${result.pageCount} trang · ${result.text.length} ký tự`)
        const parsed = parseRecordsFromColumnText(result.text, docType)
          ?? parseRecordsClientSide(result.text, docType)
          ?? parseRecordsByRowNumber(result.text)
        if (parsed && parsed.records.length > 0) {
          setRecords(parsed.records)
          setMeta(parsed.meta)
          setStep('review')
          return
        }
      }
    } catch { /* tiếp tục */ }

    // 2. PDF ảnh quét → Tesseract
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tessWorker: any = null
    try {
      setReadProgress('🔍 PDF ảnh quét — OCR (vui lòng chờ)...')
      toast('Đang OCR... mỗi trang ~10–15 giây.', { icon: '⏳', duration: 120000 })
      const Tesseract = await import('tesseract.js')
      const { pdfjs } = await import('react-pdf')
      const ab = await blob.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise
      const totalPages = Math.min(pdf.numPages, 5)  // max 5 pages — balance speed vs coverage
      const pageTexts: string[] = []

      let currentPage = 1

      tessWorker = await Tesseract.createWorker('vie+eng', 1, {
        // Use the shim worker so console.warn/error are patched BEFORE the
        // Tesseract WASM initialises and emits "Parameter not found" warnings.
        // workerBlobURL:false → regular Worker (not blob), so self.location
        // resolves correctly inside the shim.
        workerPath: '/tesseract-worker-shim.js',
        workerBlobURL: false,
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setReadProgress(`🔍 Trang ${currentPage}/${totalPages}: ${Math.round(m.progress * 100)}%`)
          }
        },
      })
      // PSM 6 = uniform block; PSM 4 = single column — both usable for grade tables.
      // preserve_interword_spaces keeps column gaps so our 2+-space split works.
      await tessWorker.setParameters({
        tessedit_pageseg_mode: '6',         // 6 = assume uniform block of text
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: '',        // allow all chars (Vietnamese needs accents)
      })

      for (let i = 1; i <= totalPages; i++) {
        currentPage = i
        setReadProgress(`🔍 Tesseract OCR trang ${i}/${totalPages}...`)
        const page = await pdf.getPage(i)
        // Scale 2.5 → ~600 DPI from 300 DPI source — good balance of accuracy vs speed
        // (3.5 = ~8700×12300px per A4 page → too slow for browser Tesseract)
        const vp = page.getViewport({ scale: 2.5 })
        const canvas = document.createElement('canvas')
        canvas.width = vp.width
        canvas.height = vp.height
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
        // Otsu binarisation — speeds up Tesseract and improves contrast
        preprocessCanvasForOCR(canvas)
        // JPEG 85% — 3-5× smaller than PNG, negligible quality loss for OCR
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        const { data: { text } } = await tessWorker.recognize(dataUrl)
        pageTexts.push(text)
      }

      await tessWorker.terminate()
      tessWorker = null

      const fullText = pageTexts.join('\n\n--- TRANG ---\n\n')
      toast.dismiss()
      if (fullText.trim().length > 20) {
        setRawOcrText(fullText)
        setReadProgress(`✅ Tesseract xong · ${fullText.length} ký tự · ${totalPages} trang`)
        const parsed = parseRecordsFromColumnText(fullText, docType)
          ?? parseRecordsClientSide(fullText, docType)
          ?? parseRecordsByRowNumber(fullText)
        if (parsed && parsed.records.length > 0) {
          setRecords(parsed.records)
          setMeta(parsed.meta)
        } else {
          setRightTab('text')
        }
        setStep('review')
        return
      }
    } catch (tessErr) {
      if (tessWorker) { tessWorker.terminate().catch(() => {}); tessWorker = null }
      console.warn('[Tesseract] failed:', tessErr)
    }

    // 3. Thất bại hoàn toàn → hiển thị demo để user nhập tay
    toast('Không OCR được — hiển thị dữ liệu mẫu, vui lòng chỉnh sửa thủ công.', { icon: 'ℹ️', duration: 8000 })
    setRecords(DEMO_RECORDS)
    setMeta(computeMeta(DEMO_RECORDS))
    setRightTab('table')
    setStep('review')
  }, [docType])

  // ── Load demo records khi không có rawText ─────────────────────────────────
  const loadDemoText = useCallback(() => {
    setRecords(DEMO_RECORDS)
    setMeta(computeMeta(DEMO_RECORDS))
    setStep('review')
  }, [])

  // ── Step 1: Called by PDFViewer when all pages finish loading (replaces readPdfInBrowser) ──
  const handleViewerTextExtracted = useCallback(async (pages: string[], fullText: string) => {
    if (textExtractedRef.current) return
    textExtractedRef.current = true

    setPdfReadResult({
      text: fullText, pages, pageCount: pages.length,
      isScanned: pages.every(p => p.trim().length < 20), warnings: [],
    })

    if (fullText.trim()) {
      setRawOcrText(fullText)
      setReadProgress(`Đã đọc ${pages.length} trang, ${fullText.length} ký tự ✅`)
      toast.success(`Đã đọc ${pages.length} trang PDF (${fullText.length} ký tự)`)
      await runExtract(fullText)
    } else {
      setReadProgress('PDF không có text layer — dùng Tesseract')
      loadDemoText()
    }
  }, [runExtract, loadDemoText])

  useEffect(() => {
    if (!isOpen) return
    if (runningRef.current) return   // StrictMode double-invoke guard
    runningRef.current = true

    // Xóa job cũ trong sessionStorage (có thể còn sót từ lần trước / page refresh)
    clearRunningJob()
    setValidationErrors({})
    setPdfReadResult(null)
    setRightTab('table')
    setRecords([])
    textExtractedRef.current = false

    const run = async () => {
      // Priority 1: file blob — trích xuất trực tiếp bằng pdfjs (không qua PDFViewer callback)
      if (fileBlob) {
        textExtractedRef.current = true   // prevent PDFViewer race
        setStep('loading')
        setReadProgress('Đang trích xuất văn bản từ PDF...')
        try {
          const result = await extractFromBlob(fileBlob)
          setPdfReadResult(result)

          const hasText = !result.isScanned && result.text.trim().length > 20

          if (hasText) {
            // ── Path A: PDF has a text layer ──────────────────────────────────
            setRawOcrText(result.text)
            setReadProgress(`✅ Đọc ${result.pageCount} trang · ${result.text.length.toLocaleString()} ký tự`)
            toast.success(`Đọc xong ${result.pageCount} trang PDF`)
            await runExtract(result.text)
          } else {
            // ── Path B: Scanned / image PDF → Tesseract trực tiếp ────────
            setReadProgress('🔍 PDF ảnh quét — OCR bằng Tesseract...')
            await runTesseractFallback(fileBlob)
          }
        } catch (e) {
          console.error('[OCR] extractFromBlob failed:', e)
          toast.error('Lỗi đọc file PDF. Vui lòng thêm bản ghi thủ công.')
          setRecords([])
          setMeta({})
          setStep('review')
        }
        return
      }
      // Priority 2: rawText provided by parent
      if (rawText) {
        setStep('loading')
        setRawOcrText(rawText)
        await runExtract(rawText)
        return
      }
      // Priority 3: demo text from worker
      await loadDemoText()
    }
    run()
    return () => { runningRef.current = false }  // cleanup: reset khi isOpen đổi
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fileBlob, rawText])

  // ── Inline cell edit ───────────────────────────────────────────────────────
  const handleCellChange = useCallback(
    (rowIdx: number, field: keyof StudentRecord, value: string) => {
      setRecords(prev => {
        const next = [...prev]
        const row = { ...next[rowIdx], [field]: value }
        // Auto-recalculate ket_qua when score changes
        if (field === 'diem_qp') row.ket_qua = computeKetQua(value)
        next[rowIdx] = row
        return next
      })
    },
    [],
  )

  const addRow = () => {
    setRecords(prev => [...prev, {
      stt: String(prev.length + 1), ho_ten: '', mssv: '', lop: '',
      diem_qp: '', diem_lan2: '', ket_qua: '', ghi_chu: '',
    }])
  }

  const deleteRow = (idx: number) => {
    setRecords(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Validate before save ──────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<number, string[]> = {}
    for (let i = 0; i < records.length; i++) {
      const r = records[i]
      const rowErr: string[] = []
      if (!r.ho_ten.trim()) rowErr.push('Thiếu họ tên')
      if (!r.mssv.trim()) rowErr.push('Thiếu MSSV')
      const s = parseFloat(r.diem_qp.replace(',', '.'))
      if (r.diem_qp && (isNaN(s) || s < 0 || s > 10)) rowErr.push('Điểm ngoài khoảng [0,10]')
      if (rowErr.length) errs[i] = rowErr
    }
    setValidationErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Save confirmed records ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) {
      toast.error('Vui lòng sửa các lỗi trước khi lưu')
      return
    }
    setStep('saving')
    const finalMeta = computeMeta(records)

    try {
      // Persist to Node backend
      await fetch(`/api/documents/${docId}/records`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: recordsToApiShape(records), meta: finalMeta }),
      })
    } catch { /* offline mode: skip server save */ }

    toast.success(`Đã lưu ${records.length} bản ghi`)
    onSave?.(records, finalMeta)
    setStep('done')
  }

  // ── Divider drag-to-resize ────────────────────────────────────────────────
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    const startX = e.clientX
    const startW = leftWidth
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const delta = ((ev.clientX - startX) / window.innerWidth) * 100
      setLeftWidth(Math.min(80, Math.max(20, startW + delta)))
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (!isOpen) return null

  // ── Column definitions (DSGD) ─────────────────────────────────────────────
  const COLS: { key: keyof StudentRecord; label: string; width: string; editable?: boolean }[] = [
    { key: 'stt',      label: 'STT',       width: 'w-10',  editable: false },
    { key: 'ho_ten',   label: 'Họ và Tên', width: 'w-44',  editable: true },
    { key: 'mssv',     label: 'MSSV',      width: 'w-28',  editable: true },
    { key: 'lop',      label: 'Lớp',       width: 'w-20',  editable: true },
    { key: 'diem_qp',  label: 'Điểm QP',   width: 'w-20',  editable: true },
    { key: 'diem_lan2',label: 'L2',         width: 'w-14',  editable: true },
    { key: 'ket_qua',  label: 'Kết quả',   width: 'w-24',  editable: false },
    { key: 'ghi_chu',  label: 'Ghi chú',   width: 'w-24',  editable: true },
  ]

  const statCards = [
    { label: 'Tổng', value: meta.total_records ?? records.length, color: 'text-primary-700 dark:text-primary-400' },
    { label: 'Đạt',   value: meta.so_dat ?? records.filter(r => r.ket_qua === 'Đạt').length, color: 'text-green-700' },
    { label: 'Rớt',   value: meta.so_khong_dat ?? records.filter(r => r.ket_qua === 'Không đạt').length, color: 'text-red-700' },
    { label: 'ĐTB',   value: meta.diem_trung_binh != null ? meta.diem_trung_binh.toFixed(2) : '—', color: 'text-purple-700' },
    { label: 'Tỉ lệ đạt', value: meta.ty_le_dat != null ? `${meta.ty_le_dat}%` : '—', color: 'text-orange-700' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col z-50">
      {/* ── Modal Header ── */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <div>
            <h2 className="font-bold text-gray-800 dark:text-white text-base leading-tight">Xem xét & Xác nhận OCR</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{docName}</p>
          </div>
          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 text-xs rounded-full font-medium">{docType}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          {step === 'review' && statCards.map(c => (
            <div key={c.label} className="text-center px-2 hidden md:block">
              <p className={`text-sm font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          ))}

          <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block" />

          <button
            onClick={() => setRightTab(t => t === 'text' ? 'table' : 'text')}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              rightTab === 'text'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="Xem nội dung đã đọc từ PDF"
          >
            {rightTab === 'text' ? '📊 Bảng dữ liệu' : '📝 Nội dung đã đọc'}
          </button>

          <button
            onClick={addRow}
            className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-800 text-xs rounded transition-colors"
          >
            ➕ Thêm dòng
          </button>

          <button
            onClick={() => {
              if (records.length === 0) { toast.error('Chưa có dữ liệu để xuất'); return }
              exportPdfFormatToExcel(records as any[], meta, docName, docType)
              toast.success(`Đã xuất Excel: ${docName.replace(/\.pdf$/i, '')}.xlsx`)
            }}
            disabled={records.length === 0}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors"
            title="Xuất ra Excel theo bố cục PDF gốc"
          >
            📥 Xuất Excel
          </button>

          <button
            onClick={handleSave}
            disabled={step === 'loading' || step === 'saving'}
            className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors"
          >
            {step === 'saving' ? '⏳ Đang lưu…' : '✅ Lưu xác nhận'}
          </button>

          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none px-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Step: Reading PDF in browser ── */}
      {step === 'reading_pdf' && (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4 animate-bounce">📚</div>
            <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-2">Đang đọc file PDF...</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{readProgress || 'Khởi tạo PDF.js...'}</p>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-primary-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Hệ thống đang trích xuất text layer từ PDF của bạn
            </p>
          </div>
        </div>
      )}

      {/* ── Loading spinner ── */}
      {step === 'loading' && (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 font-medium">Đang phân tích tài liệu…</p>
            <p className="text-gray-400 text-sm mt-1">OCR + Regex parsing</p>
          </div>
        </div>
      )}

      {/* ── Done confirmation ── */}
      {step === 'done' && (
        <div className="flex-1 flex items-center justify-center bg-green-50">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-green-800 text-xl font-bold mb-2">Đã lưu thành công!</p>
            <p className="text-gray-600 mb-6">
              {records.length} bản ghi đã được xác nhận và lưu vào cơ sở dữ liệu.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  exportPdfFormatToExcel(records as any[], meta, docName, docType)
                  toast.success(`Đã xuất Excel: ${docName.replace(/\.pdf$/i, '')}.xlsx`)
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
              >
                📥 Xuất Excel
              </button>
              <button onClick={handleClose} className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main split view ── */}
      {(step === 'review' || step === 'saving') && (
        <div className="flex-1 flex overflow-hidden">

          {/* ── LEFT: PDF Viewer ── */}
          <div style={{ width: `${leftWidth}%` }} className="flex flex-col bg-gray-100 overflow-hidden">
            <div className="bg-gray-700 text-white text-xs px-3 py-1 shrink-0 flex items-center gap-2">
              <span>📄 Tài liệu gốc</span>
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="ml-auto text-gray-300 hover:text-white transition-colors">
                  ↗ Mở tab mới
                </a>
              )}
            </div>
            {/* Local blob → PDFViewer renders pages + extracts text via onGetTextSuccess */}
            {fileBlob ? (
              <PDFViewer
                blob={fileBlob}
                className="flex-1"
                onTextExtracted={handleViewerTextExtracted}
              />
            ) : pdfUrl ? (
              /* Drive embed / remote URL → iframe */
              <iframe
                src={pdfUrl}
                className="flex-1 border-0"
                title="PDF Preview"
                allow="autoplay"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-5xl mb-3">📄</div>
                  <p>File PDF không khả dụng</p>
                  <p className="text-xs mt-1">Upload file để xem trước</p>
                </div>
              </div>
            )}
          </div>

          {/* ── DIVIDER (draggable) ── */}
          <div
            className="w-1.5 bg-gray-300 hover:bg-primary-400 cursor-col-resize shrink-0 transition-colors select-none"
            onMouseDown={handleDividerMouseDown}
          />

          {/* ── RIGHT: Tabs — Bảng dữ liệu | Nội dung đã đọc ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-800">

            {/* Tab bar */}
            <div className="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600 shrink-0 flex items-center">
              <button
                onClick={() => setRightTab('table')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  rightTab === 'table'
                    ? 'border-primary-600 text-primary-700 dark:text-primary-400 bg-white dark:bg-slate-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                📊 Bảng dữ liệu
                <span className="ml-1.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full px-1.5 py-0.5">
                  {records.length}
                </span>
              </button>
              <button
                onClick={() => setRightTab('text')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  rightTab === 'text'
                    ? 'border-green-600 text-green-700 bg-white dark:bg-slate-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                📝 Nội dung đã đọc
                {pdfReadResult && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                    pdfReadResult.isScanned
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {pdfReadResult.isScanned ? '🔍 Quét' : `${pdfReadResult.pageCount}tr`}
                  </span>
                )}
              </button>
            </div>

            {/* ── TAB: Bảng dữ liệu ── */}
            {rightTab === 'table' && (
              <>
            {/* Validation error banner */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="bg-red-50 border-b border-red-200 px-3 py-2 shrink-0">
                <p className="text-red-700 text-xs font-semibold">
                  ⚠️ {Object.keys(validationErrors).length} dòng có lỗi — vui lòng kiểm tra (ô màu đỏ)
                </p>
              </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-gray-50 dark:bg-slate-700 z-10">
                  <tr>
                    {COLS.map(c => (
                      <th
                        key={c.key}
                        className={`${c.width} px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap`}
                      >
                        {c.label}
                      </th>
                    ))}
                    <th className="w-8 px-1 py-2 border-b border-gray-200" />
                  </tr>
                </thead>
                <tbody>
                  {records.map((row, rowIdx) => {
                    const hasError = !!validationErrors[rowIdx]
                    const isNotDat = row.ket_qua === 'Không đạt'
                    return (
                      <tr
                        key={rowIdx}
                        className={`border-b border-gray-100 transition-colors ${
                          hasError ? 'bg-red-50 hover:bg-red-100' :
                          isNotDat ? 'bg-orange-50 hover:bg-orange-100' :
                          'hover:bg-primary-50 dark:hover:bg-primary-900/20'
                        }`}
                      >
                        {COLS.map(col => (
                          <td key={col.key} className={`${col.width} px-1 py-0.5`}>
                            {col.key === 'ket_qua' ? (
                              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                row.ket_qua === 'Đạt'
                                  ? 'bg-green-100 text-green-800'
                                  : row.ket_qua === 'Không đạt'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {row.ket_qua || '—'}
                              </span>
                            ) : col.editable ? (
                              <input
                                type="text"
                                value={row[col.key]}
                                onChange={e => handleCellChange(rowIdx, col.key, e.target.value)}
                                className={`w-full px-1.5 py-0.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 ${
                                  hasError && (col.key === 'ho_ten' || col.key === 'mssv' || col.key === 'diem_qp')
                                    ? 'border-red-400 bg-red-50'
                                    : 'border-transparent hover:border-gray-300 bg-transparent focus:bg-white'
                                }`}
                                spellCheck={false}
                              />
                            ) : (
                              <span className="px-1.5 text-gray-500">{row[col.key]}</span>
                            )}
                          </td>
                        ))}
                        <td className="px-1 py-0.5">
                          <button
                            onClick={() => deleteRow(rowIdx)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                            title="Xóa dòng"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={COLS.length + 1} className="text-center py-8 text-gray-400">
                        Không có dữ liệu. Nhấn ➕ để thêm dòng thủ công.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer stats */}
            <div className="border-t border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 px-3 py-2 shrink-0 flex gap-4 text-xs text-gray-600 dark:text-gray-300">
              {statCards.map(c => (
                <span key={c.label}>
                  <span className={`font-bold ${c.color}`}>{c.value}</span> {c.label}
                </span>
              ))}
            </div>
              </>
            )}

            {/* ── TAB: Nội dung đã đọc ── */}
            {rightTab === 'text' && (
              <div className="flex-1 overflow-auto flex flex-col">
                {/* Info bar */}
                {pdfReadResult ? (
                  <div className={`px-4 py-2 shrink-0 flex items-center gap-3 text-xs border-b ${
                    pdfReadResult.isScanned
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      : 'bg-green-50 border-green-200 text-green-800'
                  }`}>
                    <span className="text-base">{pdfReadResult.isScanned ? '🔍' : '✅'}</span>
                    <div>
                      <p className="font-semibold">
                        {pdfReadResult.isScanned
                          ? 'PDF bản quét — cần OCR backend để đọc chính xác'
                          : `Đã đọc thành công ${pdfReadResult.pageCount} trang`}
                      </p>
                      <p className="opacity-75">
                        {pdfReadResult.text.length} ký tự &nbsp;·&nbsp;
                        {pdfReadResult.pageCount} trang
                        {pdfReadResult.isScanned && ' · Đang dùng dữ liệu mẫu trong khi chờ OCR'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 shrink-0">
                    Nội dung được đọc từ text layer của PDF hoặc OCR backend.
                  </div>
                )}

                {/* Per-page text content */}
                {pdfReadResult && pdfReadResult.pages.length > 0 ? (
                  <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    {pdfReadResult.pages.map((pageText, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-3 py-1.5 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700">
                            📄 Trang {idx + 1}
                          </span>
                          <span className="text-xs text-gray-400">{pageText.length} ký tự</span>
                        </div>
                        <pre className="p-3 text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed bg-white min-h-[60px]">
                          {pageText.trim() || (
                            <span className="text-gray-400 italic">
                              (Trang trống — PDF bản quét, không có text layer)
                            </span>
                          )}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : rawOcrText ? (
                  /* Fallback: show raw OCR text without page breakdown */
                  <div className="flex-1 overflow-y-auto p-3">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-3 py-1.5">
                        <span className="text-xs font-semibold text-gray-700">📝 Văn bản thô</span>
                      </div>
                      <pre className="p-3 text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed bg-white">
                        {rawOcrText}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-3">📂</div>
                      <p>Chưa có nội dung đã đọc.</p>
                      <p className="text-xs mt-1">Upload file PDF để hệ thống đọc nội dung.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  )
}

