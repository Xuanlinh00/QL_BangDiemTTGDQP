import { Router, Request, Response } from 'express'
import multer from 'multer'
import mongoose from 'mongoose'
import { DocumentModel, StudentRecord } from '../models'
import { requireMongoDB } from '../middleware/mongodb-check.middleware'

const router = Router()

// All docstore routes require MongoDB
router.use(requireMongoDB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } }) // 500MB limit

// ── Initialize GridFS buckets ──
let gridFSBucket: mongoose.mongo.GridFSBucket | null = null

mongoose.connection.on('open', () => {
  gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName: 'docstore_files' })
})

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

    if (!gridFSBucket) {
      return res.status(500).json({ success: false, error: 'GridFS not initialized' })
    }

    const { folder, type, academicYear, cohort, className, trainingProgram } = req.body
    const created = []

    for (const f of files) {
      // Create document record first
      const doc = await DocumentModel.create({
        name: Buffer.from(f.originalname, 'latin1').toString('utf8'),
        folder: folder || '',
        type: type || '',
        pages: 0,
        status: 'Pending',
        extract_status: 'Pending',
        uploaded_at: new Date().toISOString().split('T')[0],
        source: 'local',
        mimeType: f.mimetype,
        academicYear,
        cohort,
        className,
        trainingProgram,
      } as any)

      // Upload file to GridFS
      const uploadStream = gridFSBucket.openUploadStream(doc._id.toString(), {
        metadata: {
          docId: doc._id.toString(),
          fileName: f.originalname,
          mimeType: f.mimetype,
          uploadedAt: new Date(),
        },
      })

      uploadStream.on('error', (err) => {
        console.error('GridFS upload error:', err)
      })

      uploadStream.end(f.buffer)

      // Wait for upload to complete
      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve)
        uploadStream.on('error', reject)
      })

      // Update document with GridFS file ID
      doc.gridfsFileId = uploadStream.id
      await doc.save()

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

    if (!gridFSBucket) {
      return res.status(500).json({ success: false, error: 'GridFS not initialized' })
    }

    // Try GridFS first
    if (doc.gridfsFileId) {
      try {
        const downloadStream = gridFSBucket.openDownloadStream(doc.gridfsFileId)
        res.set('Content-Type', doc.mimeType || 'application/pdf')
        res.set('Content-Disposition', `inline; filename="${encodeURIComponent(doc.name)}"`)
        return downloadStream.pipe(res)
      } catch (err) {
        console.warn('GridFS download failed, trying legacy fileData:', err)
      }
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
      // Delete from GridFS if exists
      if (doc.gridfsFileId && gridFSBucket) {
        try {
          await gridFSBucket.delete(doc.gridfsFileId)
        } catch (err) {
          console.warn('GridFS delete failed:', err)
        }
      }
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
