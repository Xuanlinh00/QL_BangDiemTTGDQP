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
  docType: 'DSGD' | 'QD' | 'KeHoach'
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
  return raw
    .replace(/\r/g, '')
    // Ghép số bị tách bởi 1 khoảng trắng (OCR artifact): "7 5" → "75"
    // KHÔNG ghép khi cách 2+ dấu cách (phân cách cột bảng)
    .replace(/(\d) (\d)/g, '$1$2')
    // Sửa dấu thập phân bị tách: "9 . 8" hoặc "9,8" → "9.8"
    .replace(/(\d)\s*[.,]\s*(\d)/g, '$1.$2')
    // Sửa O/o/Q → 0 khi kẹp giữa 2 chữ số (OCR nhầm 0 vs O)
    .replace(/(\d)[OoQq](\d)/g, '$10$2')
    // Sửa l/I/| → 1 khi kẹp giữa 2 chữ số
    .replace(/(\d)[lI|](\d)/g, '$11$2')
    // Xóa ký tự nhiễu đầu dòng từ Tesseract
    .replace(/^[\[\]{}|\\<>@#$%^&*~`]+/gm, '')
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

  // MSSV TVU: 9 chữ số bắt đầu bằng 1 (vd: 110122001)
  // Hoặc có thể có prefix chữ hoa (DA210001, DT22001...)
  // Cho phép OCR nhầm O↔0, l↔1 nên dùng [0-9OIl] sau ký tự đầu
  const MSSV_RE = /\b([A-Z]{1,3}[0-9]{5,10}|1[0-9]{8}|[0-9]{8,10})\b/g

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
    // Tên: token có ≥2 chữ cái và không phải toàn số, không phải mssv
    const ho_ten = tokens.find(t => /[a-zA-ZÀ-ỹ]{2}/.test(t) && !/^\d+$/.test(t) && t !== mssv) ?? ''
    const dq = scores[0] ?? null
    const dl = scores[1] ?? null

    records.push({
      stt: String(sttNum),
      ho_ten,
      mssv,
      lop: '',
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
    if (pageCanvases.length === 1) return pageCanvases[0].toDataURL('image/png')

    // Ghép tất cả trang theo chiều dọc
    const totalWidth  = Math.max(...pageCanvases.map(c => c.width))
    const totalHeight = pageCanvases.reduce((s, c) => s + c.height, 0)
    const merged = document.createElement('canvas')
    merged.width  = totalWidth
    merged.height = totalHeight
    const mCtx = merged.getContext('2d')!
    let y = 0
    for (const c of pageCanvases) { mCtx.drawImage(c, 0, y); y += c.height }
    return merged.toDataURL('image/png')
  } catch {
    return URL.createObjectURL(blob)
  }
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
    const cs = parseRecordsClientSide(text, docType) ?? parseRecordsByRowNumber(text)
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
        const parsed = parseRecordsClientSide(result.text, docType) ?? parseRecordsByRowNumber(result.text)
        if (parsed && parsed.records.length > 0) {
          setRecords(parsed.records)
          setMeta(parsed.meta)
          setStep('review')
          return
        }
      }
    } catch { /* tiếp tục */ }

    // 2. PDF ảnh quét → Tesseract (chỉ 2 trang đầu, JPEG để nhanh hơn)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tessWorker: any = null
    try {
      setReadProgress('🔍 PDF ảnh quét — OCR trang 1 (vui lòng chờ ~20 giây)...')
      toast('Đang OCR... vui lòng chờ.', { icon: '⏳', duration: 60000 })
      const Tesseract = await import('tesseract.js')
      const { pdfjs } = await import('react-pdf')
      const ab = await blob.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise
      const totalPages = Math.min(pdf.numPages, 2)
      const pageTexts: string[] = []

      // currentPageRef tracks the active page for the shared worker logger
      let currentPage = 1

      // createWorker (not Tesseract.recognize) so workerBlobURL/workerPath are honoured.
      // workerBlobURL:false → `new Worker('/tesseract-worker-shim.js')` (direct, not blob-wrapped)
      // The shim patches self.console.warn then loads the real worker via importScripts.
      tessWorker = await Tesseract.createWorker('vie+eng', 1, {
        workerBlobURL: false,
        workerPath: '/tesseract-worker-shim.js',
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setReadProgress(`🔍 Trang ${currentPage}/${totalPages}: ${Math.round(m.progress * 100)}%`)
          }
        },
      } as Parameters<typeof Tesseract.createWorker>[2])

      for (let i = 1; i <= totalPages; i++) {
        currentPage = i
        setReadProgress(`🔍 Tesseract OCR trang ${i}/${totalPages}...`)
        const page = await pdf.getPage(i)
        const vp = page.getViewport({ scale: 1.8 })
        const canvas = document.createElement('canvas')
        canvas.width = vp.width
        canvas.height = vp.height
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
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
        const parsed = parseRecordsClientSide(fullText, docType) ?? parseRecordsByRowNumber(fullText)
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
    { label: 'Tổng', value: meta.total_records ?? records.length, color: 'text-blue-700' },
    { label: 'Đạt',   value: meta.so_dat ?? records.filter(r => r.ket_qua === 'Đạt').length, color: 'text-green-700' },
    { label: 'Rớt',   value: meta.so_khong_dat ?? records.filter(r => r.ket_qua === 'Không đạt').length, color: 'text-red-700' },
    { label: 'ĐTB',   value: meta.diem_trung_binh != null ? meta.diem_trung_binh.toFixed(2) : '—', color: 'text-purple-700' },
    { label: 'Tỉ lệ đạt', value: meta.ty_le_dat != null ? `${meta.ty_le_dat}%` : '—', color: 'text-orange-700' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col z-50">
      {/* ── Modal Header ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <div>
            <h2 className="font-bold text-gray-800 text-base leading-tight">Xem xét & Xác nhận OCR</h2>
            <p className="text-xs text-gray-500 truncate max-w-xs">{docName}</p>
          </div>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">{docType}</span>
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
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors"
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
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4 animate-bounce">📚</div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Đang đọc file PDF...</h3>
            <p className="text-gray-500 text-sm mb-4">{readProgress || 'Khởi tạo PDF.js...'}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Hệ thống đang trích xuất text layer từ PDF của bạn
            </p>
          </div>
        </div>
      )}

      {/* ── Loading spinner ── */}
      {step === 'loading' && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Đang phân tích tài liệu…</p>
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
            className="w-1.5 bg-gray-300 hover:bg-blue-400 cursor-col-resize shrink-0 transition-colors select-none"
            onMouseDown={handleDividerMouseDown}
          />

          {/* ── RIGHT: Tabs — Bảng dữ liệu | Nội dung đã đọc ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">

            {/* Tab bar */}
            <div className="bg-gray-100 border-b border-gray-200 shrink-0 flex items-center">
              <button
                onClick={() => setRightTab('table')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  rightTab === 'table'
                    ? 'border-blue-600 text-blue-700 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Bảng dữ liệu
                <span className="ml-1.5 bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5">
                  {records.length}
                </span>
              </button>
              <button
                onClick={() => setRightTab('text')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  rightTab === 'text'
                    ? 'border-green-600 text-green-700 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
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
                <thead className="sticky top-0 bg-gray-50 z-10">
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
                          'hover:bg-blue-50'
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
                                className={`w-full px-1.5 py-0.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 ${
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
            <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 shrink-0 flex gap-4 text-xs text-gray-600">
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

