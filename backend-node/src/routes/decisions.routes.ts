import { Router, Request, Response } from 'express'
import multer from 'multer'
import mongoose from 'mongoose'
import { DecisionFile, DecisionFolder } from '../models'
import { requireMongoDB } from '../middleware/mongodb-check.middleware'

const router = Router()

// All decision routes require MongoDB
router.use(requireMongoDB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

// ── Initialize GridFS bucket ──
let gridFSBucket: mongoose.mongo.GridFSBucket | null = null

mongoose.connection.on('open', () => {
  gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName: 'decisions_files' })
})

// ── List all decisions (optionally filter by year) ──
router.get('/', async (req: Request, res: Response) => {
  try {
    const mongoConnected = mongoose.connection.readyState === 1
    
    if (!mongoConnected) {
      // Return empty list if MongoDB not connected
      return res.json({ success: true, data: [] })
    }

    const filter: any = {}
    if (req.query.year) filter.year = req.query.year
    const files = await DecisionFile.find(filter).select('-fileData').sort({ fileName: 1 })
    res.json({ success: true, data: files })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Upload decision files ──
router.post('/upload', upload.array('files', 50), async (req: Request, res: Response) => {
  try {
    const year = req.body.year || ''
    const uploadedFiles = req.files as Express.Multer.File[]
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided' })
    }

    // Initialize GridFS bucket if not already done
    if (!gridFSBucket && mongoose.connection.db) {
      gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'decisions_files' })
    }

    if (!gridFSBucket) {
      return res.status(500).json({ success: false, error: 'GridFS not initialized' })
    }

    const results = []
    const errors: string[] = []
    const skipped: string[] = []

    // Pre-fetch existing fileNames for this year to detect duplicates
    const existingFiles = await DecisionFile.find({ year }, { fileName: 1 }).lean()
    const existingNames = new Set(existingFiles.map(f => f.fileName))

    for (const file of uploadedFiles) {
      try {
        const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8')

        // Skip duplicate fileName within same year
        if (existingNames.has(fileName)) {
          skipped.push(fileName)
          continue
        }
        existingNames.add(fileName) // prevent duplicates within same batch

        const m = fileName.match(/^(\d+)[.\s]*[QqĐđ]/)
        const number = m ? m[1] : ''

        // Create metadata document (no binary data in MongoDB)
        const doc = await DecisionFile.create({
          fileName,
          number,
          date: '',
          cohort: 0,
          year,
          system: '',
          total_students: 0,
          matched: 0,
          reconciled: false,
          pages: 0,
          fileSize: file.size,
          uploadedAt: new Date().toISOString().split('T')[0],
          source: 'gridfs',
          mimeType: file.mimetype,
        })

        // Upload file to GridFS
        const uploadStream = gridFSBucket.openUploadStream(doc._id.toString(), {
          metadata: {
            docId: doc._id.toString(),
            fileName: file.originalname,
            mimeType: file.mimetype,
            uploadedAt: new Date(),
          },
        })

        uploadStream.on('error', (err) => {
          console.error('GridFS upload error:', err)
        })

        uploadStream.end(file.buffer)

        // Wait for upload to complete
        await new Promise((resolve, reject) => {
          uploadStream.on('finish', resolve)
          uploadStream.on('error', reject)
        })

        // Update document with GridFS file ID (use doc._id as the file ID)
        doc.gridfsFileId = doc._id
        await doc.save()

        results.push({
          _id: doc._id,
          fileName: doc.fileName,
          number: doc.number,
          date: doc.date,
          cohort: doc.cohort,
          year: doc.year,
          system: doc.system,
          total_students: doc.total_students,
          matched: doc.matched,
          reconciled: doc.reconciled,
          pages: doc.pages,
          fileSize: doc.fileSize,
          uploadedAt: doc.uploadedAt,
          source: doc.source,
          mimeType: doc.mimeType,
        })
      } catch (fileErr: any) {
        const fName = Buffer.from(file.originalname, 'latin1').toString('utf8')
        console.error(`Upload error for ${fName}:`, fileErr.message)
        errors.push(fName)
      }
    }

    if (results.length === 0 && skipped.length === 0) {
      return res.status(500).json({ success: false, error: `All files failed to upload` })
    }
    if (results.length === 0 && skipped.length > 0) {
      return res.status(409).json({ success: false, error: `Tất cả ${skipped.length} file đã tồn tại`, skipped })
    }
    res.json({ success: true, data: results, errors: errors.length > 0 ? errors : undefined, skipped: skipped.length > 0 ? skipped : undefined })
  } catch (err: any) {
    console.error('Upload error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Download file blob ──
router.get('/:id/file', async (req: Request, res: Response) => {
  try {
    const doc = await DecisionFile.findById(req.params.id)
    if (!doc) {
      return res.status(404).json({ success: false, error: 'File not found in database' })
    }

    // Initialize GridFS bucket if not already done
    if (!gridFSBucket && mongoose.connection.db) {
      gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'decisions_files' })
    }

    if (!gridFSBucket) {
      return res.status(500).json({ success: false, error: 'GridFS not initialized' })
    }

    res.set('Content-Type', doc.mimeType || 'application/pdf')
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`)

    // Use doc._id as the GridFS file ID
    const fileId = doc.gridfsFileId || doc._id
    
    try {
      const downloadStream = gridFSBucket.openDownloadStream(fileId)
      return downloadStream.pipe(res)
    } catch (err) {
      console.error('GridFS download error:', err)
      return res.status(404).json({ success: false, error: 'File not found in GridFS' })
    }
  } catch (err: any) {
    console.error('Download endpoint error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Update decision metadata ──
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { number, date, cohort, year, system, total_students, matched, pages } = req.body
    const doc = await DecisionFile.findByIdAndUpdate(
      req.params.id,
      { $set: { number, date, cohort, year, system, total_students, matched, pages } },
      { new: true }
    ).select('-fileData')
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: doc })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Delete decision ──
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await DecisionFile.findByIdAndDelete(req.params.id)
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' })
    
    // Initialize GridFS bucket if not already done
    if (!gridFSBucket && mongoose.connection.db) {
      gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'decisions_files' })
    }
    
    // Delete from GridFS if exists
    if (gridFSBucket) {
      try {
        const fileId = doc.gridfsFileId || doc._id
        await gridFSBucket.delete(fileId)
      } catch (err) {
        console.warn('GridFS delete failed:', err)
      }
    }
    
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Folders ──
router.get('/folders', async (_req: Request, res: Response) => {
  try {
    const mongoConnected = mongoose.connection.readyState === 1
    
    if (!mongoConnected) {
      return res.json({ success: true, data: [] })
    }

    const folders = await DecisionFolder.find().sort({ name: -1 })
    res.json({ success: true, data: folders })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/folders', async (req: Request, res: Response) => {
  try {
    const folder = await DecisionFolder.create({ name: req.body.name, type: req.body.type || 'year' })
    res.json({ success: true, data: folder })
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ success: false, error: 'Folder already exists' })
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/folders/:id', async (req: Request, res: Response) => {
  try {
    await DecisionFolder.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/folders/:id', async (req: Request, res: Response) => {
  try {
    const folder = await DecisionFolder.findByIdAndUpdate(req.params.id, { $set: { name: req.body.name } }, { new: true })
    if (!folder) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: folder })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Fix encoding of existing filenames + remove duplicates ──
router.post('/fix-encoding', async (_req: Request, res: Response) => {
  try {
    const allFiles = await DecisionFile.find().select('-fileData').sort({ createdAt: 1 })
    let removed = 0
    let fixed = 0
    const seen = new Map<string, string>() // key: year+fileName -> first _id

    // Pass 1: identify & delete duplicates (keep first, delete rest)
    const idsToDelete: string[] = []
    for (const f of allFiles) {
      const key = `${f.year}::${f.fileName}`
      if (seen.has(key)) {
        idsToDelete.push(f._id.toString())
      } else {
        seen.set(key, f._id.toString())
      }
    }

    if (idsToDelete.length > 0) {
      const result = await DecisionFile.deleteMany({ _id: { $in: idsToDelete } })
      removed = result.deletedCount || 0
    }

    // Pass 2: fix encoding on remaining files
    const remaining = await DecisionFile.find().select('-fileData')
    for (const f of remaining) {
      try {
        // Only attempt latin1→utf8 if the filename contains characters in the latin1 range
        // that look like mojibake (bytes > 0x7F but < 0x100). Skip if already clean UTF-8.
        const hasLatin1Mojibake = /[\u0080-\u00ff]/.test(f.fileName)
        if (!hasLatin1Mojibake) {
          // Also fix U+0010 corruption (Đ stripped to its low byte)
          if (/\u0010/.test(f.fileName)) {
            const corrected = f.fileName.replace(/\u0010/g, 'Đ')
            const m = corrected.match(/^(\d+)[.\s]*[QqĐđ]/)
            await DecisionFile.findByIdAndUpdate(f._id, {
              $set: { fileName: corrected, number: m ? m[1] : f.number }
            })
            fixed++
          }
          continue
        }
        const decoded = Buffer.from(f.fileName, 'latin1').toString('utf8')
        if (decoded !== f.fileName && !decoded.includes('\ufffd')) {
          const m = decoded.match(/^(\d+)[.\s]*[QqĐđ]/)
          await DecisionFile.findByIdAndUpdate(f._id, {
            $set: { fileName: decoded, number: m ? m[1] : f.number }
          })
          fixed++
        }
      } catch {}
    }

    res.json({ success: true, fixed, removed, total: allFiles.length })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Migrate old files from local disk to GridFS ──
router.post('/migrate-to-gridfs', async (_req: Request, res: Response) => {
  try {
    // Initialize GridFS bucket if not already done
    if (!gridFSBucket && mongoose.connection.db) {
      gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'decisions_files' })
    }

    if (!gridFSBucket) {
      return res.status(500).json({ success: false, error: 'GridFS not initialized' })
    }

    // Find all files without gridfsFileId (old files)
    const oldFiles = await DecisionFile.find({ gridfsFileId: { $exists: false } })
    let migrated = 0
    let failed = 0

    for (const doc of oldFiles) {
      try {
        // Check if file has data in MongoDB
        if (doc.fileData && doc.fileData.length > 0) {
          // Upload to GridFS
          const uploadStream = gridFSBucket.openUploadStream(doc._id.toString(), {
            metadata: {
              docId: doc._id.toString(),
              fileName: doc.fileName,
              mimeType: doc.mimeType,
              uploadedAt: new Date(),
            },
          })

          uploadStream.on('error', (err) => {
            console.error('GridFS upload error:', err)
          })

          uploadStream.end(doc.fileData)

          // Wait for upload to complete
          await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve)
            uploadStream.on('error', reject)
          })

          // Update document with GridFS file ID
          await DecisionFile.findByIdAndUpdate(doc._id, {
            $set: { gridfsFileId: uploadStream.id, source: 'gridfs' },
            $unset: { fileData: 1 }, // Remove fileData from MongoDB
          })

          migrated++
        }
      } catch (err) {
        console.error(`Migration failed for ${doc.fileName}:`, err)
        failed++
      }
    }

    res.json({ success: true, migrated, failed, total: oldFiles.length })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
