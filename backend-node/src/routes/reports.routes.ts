import { Router, Request, Response } from 'express'
import { Report } from '../models'
import { requireMongoDB } from '../middleware/mongodb-check.middleware'

const router = Router()

// All report routes require MongoDB
router.use(requireMongoDB)

router.get('/', async (_req: Request, res: Response) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 })
    res.json({ success: true, data: reports })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const report = await Report.create(req.body)
    res.json({ success: true, data: report })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
    if (!report) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: report })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Report.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
