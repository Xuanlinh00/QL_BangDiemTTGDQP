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
import { extractFromBlob, PdfExtractResult } from '../../utils/pdfExtract'

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

  // ── Step 1: Read PDF in browser (PDF.js) ────────────────────────────────
  const readPdfInBrowser = useCallback(async (blob: Blob): Promise<string> => {
    setStep('reading_pdf')
    setReadProgress('Đang mở file PDF...')
    try {
      setReadProgress('Đang đọc text layer...')
      const result = await extractFromBlob(blob)
      setPdfReadResult(result)

      if (result.warnings.length) {
        result.warnings.forEach(w => toast(w, { icon: '⚠️' }))
      }

      if (result.isScanned) {
        setReadProgress(`PDF quét (${result.pageCount} trang) — chuyển sang OCR backend...`)
        // Scanned: send blob to backend OCR; for now use demo text
        toast('PDF là bản quét — dùng chế độ OCR backend (Tesseract/Vision)', { icon: '🔍' })
        return result.text // may be empty, fallback later
      } else {
        setReadProgress(`Đã đọc ${result.pageCount} trang, ${result.text.length} ký tự ✅`)
        toast.success(`Đã đọc ${result.pageCount} trang PDF (${result.text.length} ký tự)`)
        return result.text
      }
    } catch (err) {
      setReadProgress('Lỗi đọc file')
      return ''
    }
  }, [])

  // ── Step 2: Extract data from OCR text via Python worker ────────────────
  const runExtract = useCallback(async (text: string) => {
    setStep('loading')
    try {
      const resp = await fetch(`${workerUrl}/extract/parse-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId, raw_text: text, document_type: docType }),
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      const parsed: StudentRecord[] = (data.records || []).map((r: Record<string, unknown>, i: number) => ({
        stt: String(r.stt ?? i + 1),
        ho_ten: String(r.ho_ten ?? ''),
        mssv: String(r.mssv ?? ''),
        lop: String(r.lop ?? ''),
        diem_qp: r.diem_qp != null ? String(r.diem_qp) : '',
        diem_lan2: r.diem_lan2 != null ? String(r.diem_lan2) : '',
        ket_qua: String(r.ket_qua ?? ''),
        ghi_chu: String(r.ghi_chu ?? ''),
      }))
      setRecords(parsed)
      setMeta(data.meta || {})
      if (data.warnings?.length) {
        data.warnings.forEach((w: string) => toast(w, { icon: '⚠️' }))
      }
    } catch {
      toast('Không kết nối được worker; dùng dữ liệu mẫu.', { icon: 'ℹ️' })
      setRecords(DEMO_RECORDS)
      setMeta(computeMeta(DEMO_RECORDS))
    }
    setStep('review')
  }, [docId, docType, workerUrl])

  // ── Load demo OCR text when no rawText provided ───────────────────────────
  const loadDemoText = useCallback(async () => {
    try {
      const resp = await fetch(`${workerUrl}/extract/demo-text`, { method: 'POST' })
      if (resp.ok) {
        const data = await resp.json()
        setRawOcrText(data.raw_text)
        await runExtract(data.raw_text)
        return
      }
    } catch { /* fall through */ }
    // Pure fallback
    setRecords(DEMO_RECORDS)
    setMeta(computeMeta(DEMO_RECORDS))
    setStep('review')
  }, [workerUrl, runExtract])

  useEffect(() => {
    if (!isOpen) return
    setValidationErrors({})
    setPdfReadResult(null)
    setRightTab('table')

    const run = async () => {
      // Priority 1: real file blob — đọc văn bản từ PDF trong trình duyệt
      if (fileBlob) {
        const extracted = await readPdfInBrowser(fileBlob)
        if (extracted.trim()) {
          setRawOcrText(extracted)
          await runExtract(extracted)
          return
        }
        // extracted empty → scanned PDF, fall through to use demo/worker
      }

      // Priority 2: rawText already provided by parent
      if (rawText) {
        setStep('loading')
        setRawOcrText(rawText)
        await runExtract(rawText)
        return
      }

      // Priority 3: fetch demo text from worker
      await loadDemoText()
    }

    run()
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
            onClick={handleSave}
            disabled={step === 'loading' || step === 'saving'}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors"
          >
            {step === 'saving' ? '⏳ Đang lưu…' : '✅ Lưu xác nhận'}
          </button>

          <button
            onClick={onClose}
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
            <button onClick={onClose} className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg">
              Đóng
            </button>
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
            {pdfUrl ? (
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

