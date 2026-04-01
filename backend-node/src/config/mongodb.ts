import mongoose from 'mongoose'
import { logger } from './logger'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/tvu_documents?authSource=admin'

export async function connectMongoDB() {
  // Skip MongoDB if URI is default localhost
  if (MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1')) {
    logger.warn('MongoDB URI is localhost - skipping MongoDB connection')
    logger.warn('Some features requiring MongoDB will not work')
    return
  }

  try {
    logger.info('Attempting to connect to MongoDB...')
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    })
    logger.info('✅ Connected to MongoDB Atlas successfully')

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err)
    })
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected, attempting reconnect...')
    })
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected')
    })
  } catch (err) {
    logger.error('MongoDB initial connection failed:', err)
    logger.warn('Continuing without MongoDB - some features will not work')
    // Don't throw - allow server to start
  }
}
