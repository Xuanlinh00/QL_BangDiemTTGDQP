import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: { id: string; email: string }
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    console.log('Auth middleware - Token:', token ? 'present' : 'missing');
    console.log('Auth middleware - Headers:', req.headers);
    
    if (!token) {
      console.warn('No token provided');
      return res.status(401).json({
        success: false,
        error: { code: 'NO_TOKEN', message: 'No token provided' },
      })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: { code: 'CONFIG_ERROR', message: 'JWT_SECRET not configured' },
      })
    }

    const decoded = jwt.verify(token, jwtSecret) as any
    req.user = decoded
    console.log('Auth successful for user:', decoded.email);
    next()
  } catch (error: any) {
    console.error('Auth error:', error.message);
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
    })
  }
}
