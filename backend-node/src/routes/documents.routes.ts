import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { validate, schemas } from '../middleware/validation.middleware'
import { uploadLimiter } from '../middleware/rateLimiter.middleware'
import axios from 'axios'
import ExcelJS from 'exceljs'
import path from 'path'

const router = Router()
router.use(authMiddleware)

const PYTHON_WORKER = process.env.PYTHON_WORKER_URL || 'http://localhost:8000'

// ── In-memory document store (replace with MongoDB in production) ──
interface StudentRecord {
  stt?: string
  ho_ten?: string
  mssv?: string
  lop?: string
  diem_qp?: number | null
  diem_lan2?: number | null
  ket_qua?: string
  ghi_chu?: string
}

interface DocumentMeta {
  id: string
  name: string
  folder: string
  type: string
  source: string
  ocr_status: string
  extract_status: string
  uploaded_at: string
  raw_text?: string
  records?: StudentRecord[]
  meta?: Record<string, unknown>
}

const _docs: Map<string, DocumentMeta> = new Map()

// ─────────────────────────────────────────────
// GET /api/documents — list all documents
// ─────────────────────────────────────────────
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Array.from(_docs.values()),
    pagination: { page: 1, limit: 100, total: _docs.size, pages: 1 },
  })
})

// ─────────────────────────────────────────────
// POST /api/documents/register
// Register a document after client-side upload
// ─────────────────────────────────────────────
router.post('/register', uploadLimiter, validate(schemas.registerDocument), (req: Request, res: Response) => {
  const { id, name, folder, type, source, uploaded_at } = req.body
  
  const doc: DocumentMeta = {
    id,
    name,
    folder,
    type,
    source,
    ocr_status: 'Pending',
    extract_status: 'Pending',
    uploaded_at,
  }
  _docs.set(id, doc)
  res.json({ success: true, data: doc })
})

// ─────────────────────────────────────────────
// POST /api/documents/:id/ocr
// Trigger OCR via Python worker (raw_text in body OR multipart)
// ─────────────────────────────────────────────
router.post('/:id/ocr', async (req: Request, res: Response) => {
  const docId = req.params.id
  const { raw_text, document_type } = req.body

  // Update or create doc entry
  if (!_docs.has(docId)) {
    _docs.set(docId, {
      id: docId, name: docId, folder: 'Upload',
      type: document_type || 'DSGD', source: 'local',
      ocr_status: 'Processing', extract_status: 'Pending',
      uploaded_at: new Date().toISOString().split('T')[0],
    })
  } else {
    _docs.get(docId)!.ocr_status = 'Processing'
  }

  try {
    let ocrText = raw_text

    if (!ocrText) {
      // Delegate to Python worker /ocr/process-text with empty placeholder
      const resp = await axios.post(`${PYTHON_WORKER}/ocr/process-text`, {
        document_id: docId,
        raw_text: '',
        document_type: document_type || 'DSGD',
      })
      ocrText = resp.data.raw_text || ''
    }

    const doc = _docs.get(docId)!
    doc.raw_text = ocrText
    doc.ocr_status = 'Completed'

    res.json({ success: true, task_id: `ocr_${docId}`, raw_text: ocrText })
  } catch (err: unknown) {
    const doc = _docs.get(docId)
    if (doc) doc.ocr_status = 'Error'
    const msg = err instanceof Error ? err.message : 'OCR failed'
    res.status(500).json({ success: false, error: msg })
  }
})

// ─────────────────────────────────────────────
// POST /api/documents/:id/extract
// Parse raw_text into structured records via Python worker
// ─────────────────────────────────────────────
router.post('/:id/extract', async (req: Request, res: Response) => {
  const docId = req.params.id
  const { raw_text, document_type } = req.body

  if (!raw_text) {
    res.status(400).json({ success: false, error: 'raw_text is required' })
    return
  }

  if (_docs.has(docId)) _docs.get(docId)!.extract_status = 'Processing'

  try {
    const resp = await axios.post(`${PYTHON_WORKER}/extract/parse-document`, {
      document_id: docId,
      raw_text,
      document_type: document_type || 'DSGD',
    })

    const { records, meta } = resp.data
    const doc = _docs.get(docId)
    if (doc) {
      doc.records = records
      doc.meta = meta
      doc.extract_status = 'Completed'
    }

    res.json({ success: true, records, meta, warnings: resp.data.warnings })
  } catch (err: unknown) {
    if (_docs.has(docId)) _docs.get(docId)!.extract_status = 'Error'
    const msg = err instanceof Error ? err.message : 'Extract failed'
    res.status(500).json({ success: false, error: msg })
  }
})

// ─────────────────────────────────────────────
// PUT /api/documents/:id/records
// Save reviewed/corrected records back to store
// ─────────────────────────────────────────────
router.put('/:id/records', (req: Request, res: Response) => {
  const docId = req.params.id
  const { records, meta } = req.body

  if (!_docs.has(docId)) {
    res.status(404).json({ success: false, error: 'Document not found' })
    return
  }

  const doc = _docs.get(docId)!
  doc.records = records
  if (meta) doc.meta = meta
  doc.extract_status = 'Completed'

  res.json({ success: true, message: 'Records saved', count: records?.length ?? 0 })
})

// ─────────────────────────────────────────────
// GET /api/documents/:id/records
// Fetch stored records for a document
// ─────────────────────────────────────────────
router.get('/:id/records', (req: Request, res: Response) => {
  const doc = _docs.get(req.params.id)
  if (!doc) {
    res.status(404).json({ success: false, error: 'Document not found' })
    return
  }
  res.json({ success: true, records: doc.records ?? [], meta: doc.meta ?? {} })
})

// ─────────────────────────────────────────────
// GET /api/documents/export/excel
// Generate and stream an Excel workbook from all stored records
// ─────────────────────────────────────────────
router.get('/export/excel', async (req: Request, res: Response) => {
  const docId = req.query.doc_id as string | undefined

  const docs = docId
    ? [_docs.get(docId)].filter(Boolean) as DocumentMeta[]
    : Array.from(_docs.values())

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'TVU GDQP-AN System'
  workbook.created = new Date()

  // ── Sheet 1: Summary ──
  const summarySheet = workbook.addWorksheet('Tổng hợp')
  summarySheet.columns = [
    { header: 'Tên file', key: 'name', width: 30 },
    { header: 'Loại', key: 'type', width: 12 },
    { header: 'Nguồn', key: 'source', width: 12 },
    { header: 'Ngày upload', key: 'uploaded_at', width: 16 },
    { header: 'Trạng thái OCR', key: 'ocr_status', width: 16 },
    { header: 'Trạng thái Extract', key: 'extract_status', width: 18 },
    { header: 'Số bản ghi', key: 'record_count', width: 12 },
    { header: 'Điểm TB', key: 'diem_tb', width: 10 },
    { header: 'Tỉ lệ đạt (%)', key: 'ty_le_dat', width: 14 },
  ]
  _styleHeaderRow(summarySheet)

  for (const doc of docs) {
    const m = doc.meta as Record<string, number> | undefined
    summarySheet.addRow({
      name: doc.name,
      type: doc.type,
      source: doc.source,
      uploaded_at: doc.uploaded_at,
      ocr_status: doc.ocr_status,
      extract_status: doc.extract_status,
      record_count: doc.records?.length ?? 0,
      diem_tb: m?.diem_trung_binh ?? '',
      ty_le_dat: m?.ty_le_dat ?? '',
    })
  }
  _autoFilter(summarySheet)

  // ── Sheet 2+: Per-document student records ──
  for (const doc of docs) {
    if (!doc.records?.length) continue
    const sheetName = doc.name.replace(/[*?:/\\[\]]/g, '_').slice(0, 31)
    const sheet = workbook.addWorksheet(sheetName)

    if (doc.type === 'DSGD') {
      sheet.columns = [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'Họ và Tên', key: 'ho_ten', width: 28 },
        { header: 'MSSV', key: 'mssv', width: 14 },
        { header: 'Lớp', key: 'lop', width: 12 },
        { header: 'Điểm QP', key: 'diem_qp', width: 10 },
        { header: 'Điểm lần 2', key: 'diem_lan2', width: 12 },
        { header: 'Kết quả', key: 'ket_qua', width: 12 },
        { header: 'Ghi chú', key: 'ghi_chu', width: 22 },
      ]
      _styleHeaderRow(sheet)
      for (const rec of doc.records as StudentRecord[]) {
        const row = sheet.addRow({
          stt: rec.stt ?? '',
          ho_ten: rec.ho_ten ?? '',
          mssv: rec.mssv ?? '',
          lop: rec.lop ?? '',
          diem_qp: rec.diem_qp ?? '',
          diem_lan2: rec.diem_lan2 ?? '',
          ket_qua: rec.ket_qua ?? '',
          ghi_chu: rec.ghi_chu ?? '',
        })
        // Color "Không đạt" rows red
        if (rec.ket_qua === 'Không đạt') {
          row.getCell('ket_qua').fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: 'FFFFC7CE' },
          }
        }
      }

      // Summary rows
      sheet.addRow([])
      const m = doc.meta as Record<string, number> | undefined
      if (m) {
        sheet.addRow(['Tổng số', '', '', '', '', '', doc.records.length])
        sheet.addRow(['Đạt', '', '', '', '', '', m.so_dat ?? ''])
        sheet.addRow(['Không đạt', '', '', '', '', '', m.so_khong_dat ?? ''])
        sheet.addRow(['Tỉ lệ đạt (%)', '', '', '', '', '', m.ty_le_dat ?? ''])
        sheet.addRow(['Điểm trung bình', '', '', '', '', '', m.diem_trung_binh ?? ''])
      }
    } else {
      // Generic key-value output for other types
      sheet.columns = [
        { header: 'Trường', key: 'key', width: 24 },
        { header: 'Giá trị', key: 'value', width: 50 },
      ]
      _styleHeaderRow(sheet)
      for (const rec of doc.records) {
        for (const [k, v] of Object.entries(rec)) {
          sheet.addRow({ key: k, value: Array.isArray(v) ? v.join('; ') : String(v ?? '') })
        }
        sheet.addRow([])
      }
    }
    _autoFilter(sheet)
  }

  const fileName = `export_${new Date().toISOString().split('T')[0]}.xlsx`
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
  await workbook.xlsx.write(res)
  res.end()
})

// ─────────────────────────────────────────────
// Legacy upload stub (kept for compatibility)
// ─────────────────────────────────────────────
router.post('/upload', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Use /register then /:id/ocr for full pipeline' })
})

// ─────────────────────────────────────────────
// Excel style helpers
// ─────────────────────────────────────────────
function _styleHeaderRow(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 20
  headerRow.commit()
}

function _autoFilter(sheet: ExcelJS.Worksheet) {
  if (sheet.lastRow && sheet.lastRow.number > 1) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columnCount },
    }
  }
}

export default router
