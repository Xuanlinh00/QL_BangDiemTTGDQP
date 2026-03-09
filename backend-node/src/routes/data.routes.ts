import { Router, Request, Response } from 'express'
import { Student, Score } from '../models'

const router = Router()

// ═══════════════════════════════════
// STUDENTS
// ═══════════════════════════════════

router.get('/students', async (req: Request, res: Response) => {
  try {
    const students = await Student.find().sort({ code: 1 })
    res.json({ success: true, data: students })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/students', async (req: Request, res: Response) => {
  try {
    const student = await Student.create(req.body)
    res.json({ success: true, data: student })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/students/:id', async (req: Request, res: Response) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
    if (!student) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: student })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/students/:id', async (req: Request, res: Response) => {
  try {
    await Student.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ═══════════════════════════════════
// SCORES
// ═══════════════════════════════════

router.get('/scores', async (req: Request, res: Response) => {
  try {
    const scores = await Score.find().sort({ studentCode: 1 })
    res.json({ success: true, data: scores })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/scores', async (req: Request, res: Response) => {
  try {
    const score = await Score.create(req.body)
    res.json({ success: true, data: score })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/scores/:id', async (req: Request, res: Response) => {
  try {
    const score = await Score.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
    if (!score) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: score })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/scores/:id', async (req: Request, res: Response) => {
  try {
    await Score.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
