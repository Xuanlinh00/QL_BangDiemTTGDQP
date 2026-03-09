import { Router, Request, Response } from 'express'
import { Setting } from '../models'

const router = Router()

// Default settings to seed on first load
const DEFAULT_SETTINGS = [
  { key: 'school_name', label: 'Tên trường', value: 'Trường Đại học Trà Vinh', category: 'Chung' },
  { key: 'department', label: 'Khoa/Bộ môn', value: 'Trung tâm GDQP-AN', category: 'Chung' },
  { key: 'academic_year', label: 'Năm học hiện tại', value: '2025', category: 'Chung' },
  { key: 'semester', label: 'Học kỳ hiện tại', value: 'HK1', category: 'Chung' },
  { key: 'max_score', label: 'Điểm tối đa', value: '10', category: 'Điểm số' },
  { key: 'pass_score', label: 'Điểm đạt', value: '5', category: 'Điểm số' },
  { key: 'score_scale', label: 'Thang điểm', value: '10', category: 'Điểm số' },
  { key: 'auto_backup', label: 'Tự động sao lưu', value: 'Có', category: 'Hệ thống' },
  { key: 'language', label: 'Ngôn ngữ', value: 'Tiếng Việt', category: 'Hệ thống' },
  { key: 'theme', label: 'Giao diện', value: 'Tự động', category: 'Hệ thống' },
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

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Setting.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
