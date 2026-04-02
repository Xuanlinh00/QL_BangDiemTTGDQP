import { Router, Request, Response } from 'express'
import { Setting } from '../models'
import { requireMongoDB } from '../middleware/mongodb-check.middleware'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

// All settings routes require MongoDB
router.use(requireMongoDB)

// Configure multer for logo/banner uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/branding')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, SVG, WebP)'))
  }
})

// Default settings to seed on first load
const DEFAULT_SETTINGS = [
  // Thông tin Trung tâm
  { key: 'center_name_vi', label: 'Tên Trung tâm (Tiếng Việt)', value: 'TRUNG TÂM GIÁO DỤC QUỐC PHÒNG VÀ AN NINH', category: 'Thông tin chung' },
  { key: 'center_name_en', label: 'Tên Trung tâm (English)', value: 'Center for National Defense and Security Education', category: 'Thông tin chung' },
  
  // Thông tin Trường
  { key: 'school_name_vi', label: 'Tên Trường (Tiếng Việt)', value: 'TRƯỜNG ĐẠI HỌC TRÀ VINH', category: 'Thông tin chung' },
  { key: 'school_name_en', label: 'Tên Trường (English)', value: 'Tra Vinh University', category: 'Thông tin chung' },
  
  // Liên hệ
  { key: 'contact_address', label: 'Địa chỉ', value: 'Số 126, Nguyễn Thiện Thành, Khóm 4, Phường 5, TP. Trà Vinh, Tỉnh Trà Vinh', category: 'Liên hệ' },
  { key: 'contact_phone', label: 'Số điện thoại', value: '(0294) 3855246', category: 'Liên hệ' },
  { key: 'contact_fax', label: 'Số fax', value: '(0294) 3855247', category: 'Liên hệ' },
  { key: 'contact_email', label: 'Email', value: 'gdqp@tvu.edu.vn', category: 'Liên hệ' },
  
  // Mạng xã hội
  { key: 'social_facebook', label: 'Facebook URL', value: 'https://facebook.com/tvuniversity', category: 'Mạng xã hội' },
  { key: 'social_youtube', label: 'YouTube URL', value: 'https://youtube.com/@tvuniversity', category: 'Mạng xã hội' },
  { key: 'social_zalo', label: 'Zalo', value: 'VĐ: 0901234567', category: 'Mạng xã hội' },
  
  // Hiển thị
  { key: 'items_per_page', label: 'Số bài viết mỗi trang', value: '10', category: 'Hiển thị' },
  { key: 'maintenance_mode', label: 'Chế độ bảo trì', value: 'false', category: 'Hiển thị' },
  { key: 'maintenance_message', label: 'Thông báo bảo trì', value: 'Website đang được bảo trì, vui lòng quay lại sau.', category: 'Hiển thị' },
  
  // Màu sắc - Khớp với trang PublicAbout hiện tại
  { key: 'color_header', label: 'Màu Header', value: '#2B3A9F', category: 'Màu sắc' },
  { key: 'color_highlight', label: 'Màu nhấn', value: '#fbbf24', category: 'Màu sắc' },
  { key: 'color_link', label: 'Màu link', value: '#2563eb', category: 'Màu sắc' },
  
  // Nội dung giới thiệu
  { key: 'intro_title', label: 'Tiêu đề giới thiệu', value: 'Trung tâm Giáo dục Quốc phòng và An ninh - Trường Đại học Trà Vinh', category: 'Nội dung' },
  { key: 'intro_history', label: 'Lịch sử hình thành', value: 'Trung tâm Giáo dục Quốc phòng và An ninh được thành lập theo Quyết định số 1234/QĐ-ĐHTV ngày 15/08/2010 của Hiệu trưởng Trường Đại học Trà Vinh. Trung tâm là đơn vị trực thuộc Trường Đại học Trà Vinh, có chức năng tổ chức giảng dạy môn Giáo dục Quốc phòng và An ninh cho sinh viên toàn trường.', category: 'Nội dung' },
  { key: 'intro_mission', label: 'Chức năng nhiệm vụ', value: 'Tổ chức giảng dạy môn Giáo dục Quốc phòng và An ninh cho sinh viên toàn trường\nPhối hợp với các đơn vị liên quan tổ chức các hoạt động giáo dục quốc phòng, an ninh\nTham mưu cho Ban Giám hiệu về công tác giáo dục quốc phòng và an ninh trong nhà trường\nTổ chức các hoạt động ngoại khóa, tuyên truyền về quốc phòng và an ninh\nQuản lý cơ sở vật chất, trang thiết bị phục vụ giảng dạy', category: 'Nội dung' },
  { key: 'intro_staff', label: 'Đội ngũ cán bộ, giảng viên', value: 'Trung tâm có đội ngũ cán bộ, giảng viên giàu kinh nghiệm, được đào tạo chuyên sâu về quốc phòng và an ninh. Đội ngũ giảng viên luôn tận tâm, nhiệt huyết trong công tác giảng dạy và giáo dục sinh viên.', category: 'Nội dung' },
  { key: 'intro_facilities', label: 'Cơ sở vật chất', value: 'Trung tâm được trang bị đầy đủ cơ sở vật chất, trang thiết bị hiện đại phục vụ công tác giảng dạy và học tập. Bao gồm các phòng học lý thuyết, khu vực thực hành, sân tập, và các trang thiết bị giảng dạy chuyên dụng.', category: 'Nội dung' },
  { key: 'intro_achievements', label: 'Thành tích đạt được', value: 'Qua nhiều năm hoạt động, Trung tâm đã đạt được nhiều thành tích xuất sắc trong công tác giảng dạy và giáo dục quốc phòng, an ninh. Được Bộ Giáo dục và Đào tạo, Bộ Quốc phòng tặng nhiều bằng khen, giấy khen về thành tích xuất sắc trong công tác.', category: 'Nội dung' },
  { key: 'intro_quote', label: 'Câu trích dẫn', value: 'Giáo dục quốc phòng và an ninh là nhiệm vụ quan trọng, góp phần nâng cao nhận thức, trách nhiệm của sinh viên đối với sự nghiệp bảo vệ Tổ quốc.', category: 'Nội dung' },
  
  // Logo & Banner
  { key: 'logo_url', label: 'Logo URL', value: '', category: 'Branding' },
  { key: 'banner_url', label: 'Banner URL', value: '', category: 'Branding' },
  { key: 'home_banner_url', label: 'Home Banner URL', value: '', category: 'Branding' },
]

router.get('/', async (_req: Request, res: Response) => {
  try {
    let settings = await Setting.find().sort({ category: 1, key: 1 })
    // Seed defaults if empty
    if (settings.length === 0) {
      await Setting.insertMany(DEFAULT_SETTINGS)
      settings = await Setting.find().sort({ category: 1, key: 1 })
    }
    res.json({ success: true, data: settings })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/reset', async (_req: Request, res: Response) => {
  try {
    await Setting.deleteMany({})
    await Setting.insertMany(DEFAULT_SETTINGS)
    const settings = await Setting.find().sort({ category: 1, key: 1 })
    res.json({ success: true, data: settings })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const setting = await Setting.create(req.body)
    res.json({ success: true, data: setting })
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ success: false, error: 'Setting key already exists' })
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const setting = await Setting.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
    if (!setting) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: setting })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Upload logo
router.post('/upload-logo', upload.single('logo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }
    
    // Read file data
    const fileData = fs.readFileSync(req.file.path)
    
    // Update or create logo_url setting with file data in database
    let setting = await Setting.findOne({ key: 'logo_url' })
    if (setting) {
      setting.value = 'database' // Mark that file is in database
      setting.fileData = fileData
      setting.mimeType = req.file.mimetype
      setting.fileName = req.file.filename
      await setting.save()
    } else {
      setting = await Setting.create({ 
        key: 'logo_url', 
        label: 'Logo URL', 
        value: 'database',
        fileData: fileData,
        mimeType: req.file.mimetype,
        fileName: req.file.filename,
        category: 'Branding' 
      })
    }
    
    // Delete temporary file
    fs.unlinkSync(req.file.path)
    
    res.json({ success: true, data: { url: `/api/settings/logo/image` } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Upload banner (must be before DELETE /:id)
router.post('/upload-banner', upload.single('banner'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }
    
    // Read file data
    const fileData = fs.readFileSync(req.file.path)
    
    // Update or create banner_url setting with file data in database
    let setting = await Setting.findOne({ key: 'banner_url' })
    if (setting) {
      setting.value = 'database'
      setting.fileData = fileData
      setting.mimeType = req.file.mimetype
      setting.fileName = req.file.filename
      await setting.save()
    } else {
      setting = await Setting.create({ 
        key: 'banner_url', 
        label: 'Banner URL', 
        value: 'database',
        fileData: fileData,
        mimeType: req.file.mimetype,
        fileName: req.file.filename,
        category: 'Branding' 
      })
    }
    
    // Delete temporary file
    fs.unlinkSync(req.file.path)
    
    res.json({ success: true, data: { url: `/api/settings/banner/image` } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Upload home banner (must be before DELETE /:id)
router.post('/upload-home-banner', upload.single('homeBanner'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }
    
    // Read file data
    const fileData = fs.readFileSync(req.file.path)
    
    // Update or create home_banner_url setting with file data in database
    let setting = await Setting.findOne({ key: 'home_banner_url' })
    if (setting) {
      setting.value = 'database'
      setting.fileData = fileData
      setting.mimeType = req.file.mimetype
      setting.fileName = req.file.filename
      await setting.save()
    } else {
      setting = await Setting.create({ 
        key: 'home_banner_url', 
        label: 'Home Banner URL', 
        value: 'database',
        fileData: fileData,
        mimeType: req.file.mimetype,
        fileName: req.file.filename,
        category: 'Branding' 
      })
    }
    
    // Delete temporary file
    fs.unlinkSync(req.file.path)
    
    res.json({ success: true, data: { url: `/api/settings/home-banner/image` } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Delete logo (must be before DELETE /:id)
router.delete('/logo', async (_req: Request, res: Response) => {
  try {
    console.log('=== DELETE /logo START ===')
    
    const setting = await Setting.findOne({ key: 'logo_url' })
    console.log('Setting found:', setting ? 'Yes' : 'No')
    
    if (!setting) {
      console.log('Creating new empty logo_url setting')
      await Setting.create({ 
        key: 'logo_url', 
        label: 'Logo URL', 
        value: '', 
        category: 'Branding' 
      })
      console.log('=== DELETE /logo END (created empty) ===')
      return res.json({ success: true, message: 'No logo to delete' })
    }
    
    // Clear file data
    setting.value = ''
    setting.fileData = undefined
    setting.mimeType = undefined
    setting.fileName = undefined
    await setting.save()
    console.log('Logo data cleared from database')
    console.log('=== DELETE /logo END (success) ===')
    
    res.json({ success: true, message: 'Logo deleted successfully' })
  } catch (err: any) {
    console.error('=== DELETE /logo ERROR ===', err)
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
})

// Get logo image from database
router.get('/logo/image', async (_req: Request, res: Response) => {
  try {
    const setting = await Setting.findOne({ key: 'logo_url' })
    if (!setting || !setting.fileData) {
      return res.status(404).json({ success: false, error: 'Logo not found' })
    }
    
    res.set('Content-Type', setting.mimeType || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=31536000')
    res.send(setting.fileData)
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Delete banner (must be before DELETE /:id)
router.delete('/banner', async (_req: Request, res: Response) => {
  try {
    console.log('=== DELETE /banner START ===')
    const setting = await Setting.findOne({ key: 'banner_url' })
    
    if (!setting) {
      await Setting.create({ 
        key: 'banner_url', 
        label: 'Banner URL', 
        value: '', 
        category: 'Branding' 
      })
      return res.json({ success: true, message: 'No banner to delete' })
    }
    
    setting.value = ''
    setting.fileData = undefined
    setting.mimeType = undefined
    setting.fileName = undefined
    await setting.save()
    console.log('=== DELETE /banner END (success) ===')
    
    res.json({ success: true, message: 'Banner deleted successfully' })
  } catch (err: any) {
    console.error('=== DELETE /banner ERROR ===', err)
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
})

// Get banner image from database
router.get('/banner/image', async (_req: Request, res: Response) => {
  try {
    const setting = await Setting.findOne({ key: 'banner_url' })
    if (!setting || !setting.fileData) {
      return res.status(404).json({ success: false, error: 'Banner not found' })
    }
    
    res.set('Content-Type', setting.mimeType || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=31536000')
    res.send(setting.fileData)
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Delete home banner (must be before DELETE /:id)
router.delete('/home-banner', async (_req: Request, res: Response) => {
  try {
    console.log('=== DELETE /home-banner START ===')
    const setting = await Setting.findOne({ key: 'home_banner_url' })
    
    if (!setting) {
      await Setting.create({ 
        key: 'home_banner_url', 
        label: 'Home Banner URL', 
        value: '', 
        category: 'Branding' 
      })
      return res.json({ success: true, message: 'No home banner to delete' })
    }
    
    setting.value = ''
    setting.fileData = undefined
    setting.mimeType = undefined
    setting.fileName = undefined
    await setting.save()
    console.log('=== DELETE /home-banner END (success) ===')
    
    res.json({ success: true, message: 'Home banner deleted successfully' })
  } catch (err: any) {
    console.error('=== DELETE /home-banner ERROR ===', err)
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
})

// Get home banner image from database
router.get('/home-banner/image', async (_req: Request, res: Response) => {
  try {
    const setting = await Setting.findOne({ key: 'home_banner_url' })
    if (!setting || !setting.fileData) {
      return res.status(404).json({ success: false, error: 'Home banner not found' })
    }
    
    res.set('Content-Type', setting.mimeType || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=31536000')
    res.send(setting.fileData)
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Generic delete by ID (must be AFTER specific delete routes)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Setting.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
