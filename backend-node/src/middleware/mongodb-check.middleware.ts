import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { logger } from '../config/logger'

/**
 * Middleware to check if MongoDB is connected before processing requests
 * Returns 503 Service Unavailable if MongoDB is not connected
 */
export function requireMongoDB(req: Request, res: Response, next: NextFunction) {
  if (mongoose.connection.readyState !== 1) {
    logger.warn(`MongoDB not connected - rejecting ${req.method} ${req.path}`)
    return res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection not available. Please try again later.',
      },
    })
  }
  next()
}

/**
 * Optional MongoDB check - logs warning but allows request to proceed
 */
export function optionalMongoDB(req: Request, res: Response, next: NextFunction) {
  if (mongoose.connection.readyState !== 1) {
    logger.warn(`MongoDB not connected for ${req.method} ${req.path} - proceeding anyway`)
  }
  next()
}
