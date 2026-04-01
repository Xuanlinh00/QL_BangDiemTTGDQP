import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { logger } from '../config/logger'

/**
 * Middleware to check if MongoDB is connected before processing requests
 * Now allows requests to proceed even if MongoDB is not connected
 * (graceful degradation)
 */
export function requireMongoDB(req: Request, res: Response, next: NextFunction) {
  if (mongoose.connection.readyState !== 1) {
    logger.warn(`MongoDB not connected for ${req.method} ${req.path} - proceeding with limited functionality`)
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
