/**
 * ⚠️ DEPRECATED: This file is no longer used
 * The application now uses MongoDB only via src/config/mongodb.ts
 * TypeORM and PostgreSQL have been removed from the project.
 * 
 * Keeping this file for reference only. Can be safely deleted.
 */

// Legacy TypeORM + PostgreSQL configuration (UNUSED)
// import { DataSource } from 'typeorm'
// import { logger } from './logger'

// export const AppDataSource = new DataSource({...})

export const AppDataSource = null
export async function initializeDatabase() {
  console.warn('⚠️  initializeDatabase() is deprecated. Use connectMongoDB() instead.')
}
