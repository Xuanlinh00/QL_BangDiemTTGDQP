import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { CenterActivity } from '../models'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } })

// ── Media storage on local disk ──
const MEDIA_DIR = path.resolve(__dirname, '../../uploads/activities')
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true })
}

function getMediaPath(activityId: string, mediaId: string, ext: string): string {
  const dir = path.join(MEDIA_DIR, activityId)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `${mediaId}${ext}`)
}

function extFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp',
    'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
    'application/pdf': '.pdf',
  }
  return map[mimeType] || '.bin'
}

// Multer error handler
function handleMulterError(err: any, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, error: { message: 'File qu\u00e1 l\u1edbn (t\u1ed1i \u0111a 200MB)' } })
    }
    return res.status(400).json({ success: false, error: { message: err.message } })
  }
  next(err)
}

// Public: list activities (exclude media.data for performance)
router.get('/', async (_req, res) => {
  try {
    const items = await CenterActivity.find().sort({ order: 1, createdAt: -1 }).select('-media.data')
    res.json({ success: true, data: items })
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } })
  }
})

// Public: serve a media file by activity id + media index
router.get('/:id/media/:idx', async (req, res) => {
  try {
    const item = await CenterActivity.findById(req.params.id).select('-media.data')
    if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } })
    const idx = parseInt(req.params.idx, 10)
    if (isNaN(idx) || idx < 0 || idx >= item.media.length) {
      return res.status(404).json({ success: false, error: { message: 'Media not found' } })
    }
    const m = item.media[idx]
    res.set('Content-Type', m.mimeType)
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(m.fileName)}"`)
    res.set('Cache-Control', 'public, max-age=86400')

    // Try local file first
    const mediaId = (m as any)._id.toString()
    const filePath = getMediaPath(req.params.id, mediaId, extFromMime(m.mimeType))
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath)
    }

    // Fallback: legacy data in MongoDB
    const fullItem = await CenterActivity.findById(req.params.id)
    if (fullItem && fullItem.media[idx]?.data) {
      return res.send(fullItem.media[idx].data)
    }

    res.status(404).json({ success: false, error: { message: 'Media file not found' } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } })
  }
})

// Protected routes below
router.use(authMiddleware)

// Create with media upload
router.post('/', upload.array('files', 10), handleMulterError, async (req: Request, res: Response) => {
  try {
    const { title, description, content, icon, category, order, isActive } = req.body
    const files = (req.files as Express.Multer.File[] || [])

    // Create media metadata (no binary data in MongoDB)
    const media = files.map(f => ({
      fileName: f.originalname,
      mimeType: f.mimetype,
    }))

    const item = await CenterActivity.create({
      title, description, content: content || '',
      icon: icon || '📋',
      category: category || 'general',
      order: order ? parseInt(order, 10) : 0,
      isActive: isActive !== 'false',
      media,
    })

    // Save files to disk
    const actId = item._id.toString()
    item.media.forEach((m: any, i: number) => {
      const filePath = getMediaPath(actId, m._id.toString(), extFromMime(files[i].mimetype))
      fs.writeFileSync(filePath, files[i].buffer)
    })

    // Return without media data
    const result = item.toObject()
    ;(result as any).media = result.media.map((m: any) => ({ _id: m._id, fileName: m.fileName, mimeType: m.mimeType }))
    res.json({ success: true, data: result })
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } })
  }
})

// Update with optional media upload
router.put('/:id', upload.array('files', 10), handleMulterError, async (req: Request, res: Response) => {
  try {
    const item = await CenterActivity.findById(req.params.id).select('-media.data')
    if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } })

    const { title, description, content, icon, category, order, isActive, removeMedia } = req.body
    if (title !== undefined) item.title = title
    if (description !== undefined) item.description = description
    if (content !== undefined) item.content = content
    if (icon !== undefined) item.icon = icon
    if (category !== undefined) item.category = category
    if (order !== undefined) item.order = parseInt(order, 10)
    if (isActive !== undefined) item.isActive = isActive !== 'false'

    const actId = item._id.toString()

    // Remove media by indices (comma-separated)
    if (removeMedia) {
      const indices = removeMedia.split(',').map(Number).sort((a: number, b: number) => b - a)
      for (const idx of indices) {
        if (idx >= 0 && idx < item.media.length) {
          const m = item.media[idx] as any
          // Delete file from disk
          const filePath = getMediaPath(actId, m._id.toString(), extFromMime(m.mimeType))
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
          item.media.splice(idx, 1)
        }
      }
    }

    // Add new media files (metadata only in MongoDB)
    const newFiles = (req.files as Express.Multer.File[] || [])
    for (const f of newFiles) {
      item.media.push({ fileName: f.originalname, mimeType: f.mimetype } as any)
    }

    await item.save()

    // Save new files to disk (after save so we have _id)
    if (newFiles.length > 0) {
      const savedMedia = item.media.slice(-newFiles.length)
      savedMedia.forEach((m: any, i: number) => {
        const filePath = getMediaPath(actId, m._id.toString(), extFromMime(newFiles[i].mimetype))
        fs.writeFileSync(filePath, newFiles[i].buffer)
      })
    }

    const result = item.toObject()
    ;(result as any).media = result.media.map((m: any) => ({ _id: m._id, fileName: m.fileName, mimeType: m.mimeType }))
    res.json({ success: true, data: result })
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } })
  }
})

// Delete
router.delete('/:id', async (req, res) => {
  try {
    await CenterActivity.findByIdAndDelete(req.params.id)
    // Delete media directory
    const mediaDir = path.join(MEDIA_DIR, req.params.id)
    if (fs.existsSync(mediaDir)) {
      fs.rmSync(mediaDir, { recursive: true, force: true })
    }
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } })
  }
})

// Seed default activities
router.post('/seed', async (_req, res) => {
  try {
    const count = await CenterActivity.countDocuments()
    if (count > 0) return res.json({ success: true, message: 'Already seeded', data: [] })

    const defaults = [
      { title: 'Đào tạo GDQP-AN', description: 'Tổ chức giảng dạy các môn học Giáo dục Quốc phòng và An ninh cho sinh viên các trường đại học, cao đẳng theo chương trình quy định của Bộ Giáo dục và Đào tạo.', icon: '🎓', category: 'education', order: 1 },
      { title: 'Huấn luyện quân sự', description: 'Huấn luyện kỹ năng quân sự cơ bản: đội ngũ, chiến thuật, bắn súng, ném lựu đạn, chiến đấu cá nhân và tổ chiến đấu cho sinh viên.', icon: '🎖️', category: 'training', order: 2 },
      { title: 'Giáo dục chính trị', description: 'Giáo dục đường lối, quan điểm của Đảng và Nhà nước về quốc phòng, an ninh. Nâng cao ý thức trách nhiệm bảo vệ Tổ quốc trong tình hình mới.', icon: '📜', category: 'education', order: 3 },
      { title: 'Giáo dục pháp luật', description: 'Phổ biến kiến thức pháp luật về quốc phòng, an ninh. Giáo dục Luật Nghĩa vụ quân sự, Luật Dân quân tự vệ cho sinh viên.', icon: '⚖️', category: 'education', order: 4 },
      { title: 'Giáo dục thể chất', description: 'Tổ chức các hoạt động thể dục thể thao, rèn luyện sức khỏe, nâng cao thể lực cho sinh viên đáp ứng yêu cầu xây dựng và bảo vệ Tổ quốc.', icon: '💪', category: 'sports', order: 5 },
      { title: 'Nghiên cứu khoa học', description: 'Nghiên cứu các đề tài khoa học về giáo dục quốc phòng, an ninh. Đổi mới phương pháp giảng dạy, nâng cao chất lượng đào tạo.', icon: '🔬', category: 'research', order: 6 },
      { title: 'Hoạt động ngoại khóa', description: 'Tổ chức các hoạt động ngoại khóa: thi tìm hiểu về quốc phòng, hội thao quân sự, tham quan di tích lịch sử, giao lưu văn hóa quân sự.', icon: '🏕️', category: 'extracurricular', order: 7 },
      { title: 'Phòng chống thiên tai', description: 'Huấn luyện kỹ năng phòng chống thiên tai, cứu hộ cứu nạn. Tham gia công tác phòng chống lụt bão, tìm kiếm cứu nạn khi được huy động.', icon: '🛡️', category: 'training', order: 8 },
      { title: 'Quản lý sinh viên', description: 'Quản lý hồ sơ, bảng điểm, kết quả học tập GDQP-AN của sinh viên. Cấp chứng chỉ GDQP-AN cho sinh viên sau khi hoàn thành chương trình.', icon: '📊', category: 'management', order: 9 },
      { title: 'Hợp tác quốc tế', description: 'Trao đổi kinh nghiệm, hợp tác với các trung tâm GDQP-AN trong và ngoài nước. Tham gia hội nghị, hội thảo về giáo dục quốc phòng.', icon: '🌐', category: 'cooperation', order: 10 },
      { title: 'Phát triển đội ngũ', description: 'Bồi dưỡng nâng cao trình độ chuyên môn, nghiệp vụ cho đội ngũ giảng viên, cán bộ quản lý giáo dục quốc phòng và an ninh.', icon: '👨‍🏫', category: 'development', order: 11 },
      { title: 'Tin tức & Sự kiện', description: 'Cập nhật tin tức, sự kiện nổi bật của trung tâm. Thông báo lịch học, lịch thi, kế hoạch đào tạo GDQP-AN từng học kỳ.', icon: '📰', category: 'news', order: 12 },
    ]

    const items = await CenterActivity.insertMany(defaults)
    res.json({ success: true, data: items })
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } })
  }
})

export default router
