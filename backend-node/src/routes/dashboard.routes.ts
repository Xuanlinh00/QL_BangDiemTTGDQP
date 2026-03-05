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
      ocr_completed_percent: 65,
      total_students: 45000,
      total_scores: 95000,
      documents_pending: 120,
      documents_error: 15,
      decisions_linked: 42,
      alerts: [
        'Có 47 SV có điểm Hỏng nhưng không thấy trong QĐ công nhận',
        '15 file OCR bị lỗi, cần xử lý lại',
      ],
    },
  })
})

export default router
