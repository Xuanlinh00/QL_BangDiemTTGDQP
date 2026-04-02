import { Router, Request, Response } from 'express'
import { AboutSection } from '../models'
import { requireMongoDB } from '../middleware/mongodb-check.middleware'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

// All routes require MongoDB
router.use(requireMongoDB)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/about-sections')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|ogg/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('Only images and videos are allowed'))
  }
})

// Get all sections (sorted by order)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const sections = await AboutSection.find().sort({ order: 1 })
    res.json({ success: true, data: sections })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Get single section
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const section = await AboutSection.findById(req.params.id)
    if (!section) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: section })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Create new section
router.post('/', upload.array('media', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[]
    const media = files?.map(file => ({
      type: file.mimetype.startsWith('video/') ? 'video' : 'image',
      url: `/uploads/about-sections/${file.filename}`,
      fileName: file.originalname
    })) || []

    const section = await AboutSection.create({
      ...req.body,
      media
    })
    res.json({ success: true, data: section })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Update section
router.put('/:id', upload.array('media', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[]
    const updateData: any = { ...req.body }
    
    if (files && files.length > 0) {
      const newMedia = files.map(file => ({
        type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        url: `/uploads/about-sections/${file.filename}`,
        fileName: file.originalname
      }))
      
      // Merge with existing media if keepExisting is true
      if (req.body.keepExistingMedia === 'true') {
        const existing = await AboutSection.findById(req.params.id)
        updateData.media = [...(existing?.media || []), ...newMedia]
      } else {
        updateData.media = newMedia
      }
    }

    const section = await AboutSection.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    )
    if (!section) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: section })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Delete section
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await AboutSection.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Reorder sections
router.post('/reorder', async (req: Request, res: Response) => {
  try {
    const { sections } = req.body // Array of { id, order }
    await Promise.all(
      sections.map((s: { id: string; order: number }) =>
        AboutSection.findByIdAndUpdate(s.id, { order: s.order })
      )
    )
    const updated = await AboutSection.find().sort({ order: 1 })
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
