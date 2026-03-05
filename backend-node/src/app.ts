import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { logger } from './config/logger'
import authRoutes from './routes/auth.routes'
import documentRoutes from './routes/documents.routes'
import dashboardRoutes from './routes/dashboard.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err)
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
    },
  })
})

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})

export default app
