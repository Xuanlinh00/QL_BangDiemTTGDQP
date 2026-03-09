import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { logger } from '../config/logger'
import { authLimiter } from '../middleware/rateLimiter.middleware'
import { validate, schemas } from '../middleware/validation.middleware'

const router = Router()

// Demo users (in production, use database)
const DEMO_USERS = [
  {
    id: '1',
    email: 'admin@tvu.edu.vn',
    password: '$2a$10$Tp83TVHh1qB7fPZRqDNoReywn/psqMbw0dclY7OW.eMll/7qP4OXm', // password
    name: 'Admin TVU',
  },
]

router.post('/login', authLimiter, validate(schemas.login), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = DEMO_USERS.find((u) => u.email === email)
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      })
    }

    // Generate token
    const jwtSecret = process.env.JWT_SECRET || 'tvu-gdqp-dev-secret-change-in-production'
    const token = jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '24h' }
    )

    logger.info(`User ${email} logged in`)

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    })
  } catch (error: any) {
    logger.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'LOGIN_ERROR', message: error.message },
    })
  }
})

router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out' })
})

export default router
