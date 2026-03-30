import mongoose from 'mongoose'
import { logger } from './logger'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/tvu_documents?authSource=admin'

export async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    })
    logger.info('Connected to MongoDB Atlas')

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
    throw err
  }
}
