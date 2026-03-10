import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { DocumentModel, StudentRecord } from '../models'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

// ── File storage on local disk ──
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads/docstore')
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

function getFilePath(docId: string, mimeType?: string): string {
  const ext = mimeType?.includes('spreadsheet') || mimeType?.includes('excel') ? '.xlsx' : '.pdf'
  return path.join(UPLOADS_DIR, `${docId}${ext}`)
}

// ── List all documents ──
router.get('/', async (_req: Request, res: Response) => {
  try {
    const docs = await DocumentModel.find({}, { fileData: 0 }).sort({ uploaded_at: -1 })
    res.json({ success: true, data: docs })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Upload multiple files ──
router.post('/upload', upload.array('files', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[]
    if (!files?.length) return res.status(400).json({ success: false, error: 'No files' })

    const { folder, type, academicYear, cohort, className, trainingProgram } = req.body
    const created = []

    for (const f of files) {
      const doc = await DocumentModel.create({
        name: Buffer.from(f.originalname, 'latin1').toString('utf8'),
        folder: folder || '',
        type: type || '',
        pages: 0,
        ocr_status: 'N/A',
        extract_status: 'Pending',
        uploaded_at: new Date().toISOString().split('T')[0],
        source: 'local',
        mimeType: f.mimetype,
        academicYear,
        cohort,
        className,
        trainingProgram,
      } as any)

      // Save file to local disk instead of MongoDB
      const filePath = getFilePath(doc._id.toString(), f.mimetype)
      fs.writeFileSync(filePath, f.buffer)

      created.push(doc.toObject())
    }

    res.json({ success: true, data: created })
  } catch (err: any) {
    console.error('Docstore upload error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Save Google Drive document (no file data, just metadata) ──
router.post('/gdrive', async (req: Request, res: Response) => {
  try {
    const doc = await DocumentModel.create({
      ...req.body,
      source: 'google_drive',
      uploaded_at: new Date().toISOString().split('T')[0],
    })
    const { fileData, ...rest } = doc.toObject()
    res.json({ success: true, data: rest })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Get file data for preview ──
router.get('/:id/file', async (req: Request, res: Response) => {
  try {
    const doc = await DocumentModel.findById(req.params.id)
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' })

    // Try local disk first
    const filePath = getFilePath(doc._id.toString(), doc.mimeType)
    if (fs.existsSync(filePath)) {
      res.set('Content-Type', doc.mimeType || 'application/pdf')
      res.set('Content-Disposition', `inline; filename="${encodeURIComponent(doc.name)}"`)
      return res.send(fs.readFileSync(filePath))
    }

    // Fallback to MongoDB fileData (legacy)
    if (doc.fileData) {
      res.set('Content-Type', doc.mimeType || 'application/pdf')
      res.set('Content-Disposition', `inline; filename="${encodeURIComponent(doc.name)}"`)
      return res.send(doc.fileData)
    }

    res.status(404).json({ success: false, error: 'No file data' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Update document metadata ──
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await DocumentModel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, projection: { fileData: 0 } }
    )
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: doc })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Delete document ──
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await DocumentModel.findById(req.params.id)
    if (doc) {
      // Clean up file on disk
      const filePath = getFilePath(doc._id.toString(), doc.mimeType)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      await doc.deleteOne()
    }
    // Also clean up student records for this document
    await StudentRecord.deleteMany({ docId: req.params.id })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ═══════════════════════════════════════
// Student Records
// ═══════════════════════════════════════

// ── List all student records (optionally filter by docId) ──
router.get('/student-records', async (req: Request, res: Response) => {
  try {
    const filter = req.query.docId ? { docId: req.query.docId as string } : {}
    const records = await StudentRecord.find(filter).sort({ stt: 1 })
    res.json({ success: true, data: records })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Bulk save student records for a document ──
router.post('/student-records/bulk', async (req: Request, res: Response) => {
  try {
    const { docId, docName, records } = req.body
    if (!docId || !Array.isArray(records)) {
      return res.status(400).json({ success: false, error: 'docId and records[] required' })
    }
    // Remove old records for this doc, then insert new ones
    await StudentRecord.deleteMany({ docId })
    const toInsert = records.map((r: any) => ({ ...r, docId, docName: docName || '' }))
    const created = await StudentRecord.insertMany(toInsert)
    res.json({ success: true, data: created })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Delete student records for a document ──
router.delete('/student-records/:docId', async (req: Request, res: Response) => {
  try {
    await StudentRecord.deleteMany({ docId: req.params.docId })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
