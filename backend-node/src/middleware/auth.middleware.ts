import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: { id: string; email: string }
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_TOKEN', message: 'No token provided' },
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
    })
  }
}
