import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { logger } from './config/logger'
import { connectMongoDB } from './config/mongodb'
import { apiLimiter } from './middleware/rate-limiter.middleware'
import authRoutes from './routes/auth.routes'
import documentRoutes from './routes/documents.routes'
import dashboardRoutes from './routes/dashboard.routes'
import decisionsRoutes from './routes/decisions.routes'
import dataRoutes from './routes/data.routes'
import reportsRoutes from './routes/reports.routes'
import settingsRoutes from './routes/settings.routes'
import aboutSectionsRoutes from './routes/about-sections.routes'
import docstoreRoutes from './routes/docstore.routes'
import activitiesRoutes from './routes/activities.routes'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3000

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',')
app.use(cors({
  origin: allowedOrigins.map(origin => origin.trim()),
  credentials: true,
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'))

// Rate limiting
app.use('/api/', apiLimiter)

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/decisions', decisionsRoutes)
app.use('/api/data', dataRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/about-sections', aboutSectionsRoutes)
app.use('/api/docstore', docstoreRoutes)
app.use('/api/activities', activitiesRoutes)

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'TVU GDQP-AN Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
    }
  })
})

// Suppress Chrome DevTools probe
app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
  res.status(200).json({})
})

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

// Connect to MongoDB then start server
connectMongoDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    logger.error('Failed to connect MongoDB:', err)
    // Start server anyway - MongoDB is optional for some features
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT} (MongoDB not connected)`)
    })
  })

// Keep alive on uncaught errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err)
})
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason)
})

export default app
