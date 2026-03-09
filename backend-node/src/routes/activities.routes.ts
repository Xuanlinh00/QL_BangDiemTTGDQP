import { Router } from 'express'
import multer from 'multer'
import { CenterActivity } from '../models'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

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
    const item = await CenterActivity.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } })
    const idx = parseInt(req.params.idx, 10)
    if (isNaN(idx) || idx < 0 || idx >= item.media.length) {
      return res.status(404).json({ success: false, error: { message: 'Media not found' } })
    }
    const m = item.media[idx]
    res.set('Content-Type', m.mimeType)
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(m.fileName)}"`)
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(m.data)
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } })
  }
})

// Protected routes below
router.use(authMiddleware)

// Create with media upload
router.post('/', upload.array('files', 10), async (req, res) => {
  try {
    const { title, description, content, icon, category, order, isActive } = req.body
    const media = (req.files as Express.Multer.File[] || []).map(f => ({
      fileName: f.originalname,
      mimeType: f.mimetype,
      data: f.buffer,
    }))
    const item = await CenterActivity.create({
      title, description, content: content || '',
      icon: icon || '📋',
      category: category || 'general',
      order: order ? parseInt(order, 10) : 0,
      isActive: isActive !== 'false',
      media,
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
router.put('/:id', upload.array('files', 10), async (req, res) => {
  try {
    const item = await CenterActivity.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } })

    const { title, description, content, icon, category, order, isActive, removeMedia } = req.body
    if (title !== undefined) item.title = title
    if (description !== undefined) item.description = description
    if (content !== undefined) item.content = content
    if (icon !== undefined) item.icon = icon
    if (category !== undefined) item.category = category
    if (order !== undefined) item.order = parseInt(order, 10)
    if (isActive !== undefined) item.isActive = isActive !== 'false'

    // Remove media by indices (comma-separated)
    if (removeMedia) {
      const indices = removeMedia.split(',').map(Number).sort((a: number, b: number) => b - a)
      for (const idx of indices) {
        if (idx >= 0 && idx < item.media.length) {
          item.media.splice(idx, 1)
        }
      }
    }

    // Add new media files
    const newFiles = (req.files as Express.Multer.File[] || [])
    for (const f of newFiles) {
      item.media.push({ fileName: f.originalname, mimeType: f.mimetype, data: f.buffer } as any)
    }

    await item.save()
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
