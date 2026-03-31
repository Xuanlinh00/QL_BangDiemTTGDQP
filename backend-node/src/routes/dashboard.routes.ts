import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)

router.get('/metrics', (req, res) => {
  res.json({
    success: true,
    data: {
      total_documents: 550,
      total_pages: 43000,
      documents_completed_percent: 65,
      documents_pending: 120,
      documents_error: 15,
      decisions_count: 42,
      alerts: [
        '15 file bị lỗi, cần xử lý lại',
      ],
    },
  })
})

export default router
