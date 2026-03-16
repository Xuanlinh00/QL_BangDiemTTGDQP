/**
 * Migration script: Move files from local disk to MongoDB GridFS
 * Usage: npx ts-node scripts/migrate-files-to-gridfs.ts
 */

import mongoose from 'mongoose'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { DocumentModel } from '../src/models'

dotenv.config()

const UPLOADS_DIR = path.resolve(__dirname, '../uploads/docstore')
const DECISIONS_DIR = path.resolve(__dirname, '../uploads/decisions')
const ACTIVITIES_DIR = path.resolve(__dirname, '../uploads/activities')

let gridFSBucket: mongoose.mongo.GridFSBucket | null = null

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/docstore')
    console.log('✅ Connected to MongoDB')
    gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName: 'docstore_files' })
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err)
    process.exit(1)
  }
}

async function migrateDocstoreFiles() {
  console.log('\n📂 Migrating docstore files...')
  
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('⚠️  Docstore directory not found, skipping')
    return
  }

  const files = fs.readdirSync(UPLOADS_DIR)
  console.log(`Found ${files.length} files to migrate`)

  for (const file of files) {
    try {
      const filePath = path.join(UPLOADS_DIR, file)
      const fileBuffer = fs.readFileSync(filePath)
      
      // Extract docId from filename (e.g., "69ae4001b825959926905c76.pdf" → "69ae4001b825959926905c76")
      const docId = file.replace(/\.[^/.]+$/, '')
      
      // Find document in MongoDB
      const doc = await DocumentModel.findById(docId)
      if (!doc) {
        console.log(`⚠️  Document not found for file: ${file}`)
        continue
      }

      // Check if already migrated
      if (doc.gridfsFileId) {
        console.log(`✓ Already migrated: ${file}`)
        continue
      }

      // Upload to GridFS
      const uploadStream = gridFSBucket!.openUploadStream(docId, {
        metadata: {
          docId,
          fileName: doc.name,
          mimeType: doc.mimeType,
          migratedAt: new Date(),
        },
      })

      uploadStream.end(fileBuffer)

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve)
        uploadStream.on('error', reject)
      })

      // Update document with GridFS file ID
      doc.gridfsFileId = uploadStream.id
      await doc.save()

      console.log(`✅ Migrated: ${file} (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)`)
    } catch (err) {
      console.error(`❌ Error migrating ${file}:`, err)
    }
  }
}

async function migrateDecisionFiles() {
  console.log('\n📂 Migrating decision files...')
  
  if (!fs.existsSync(DECISIONS_DIR)) {
    console.log('⚠️  Decisions directory not found, skipping')
    return
  }

  const { DecisionFile } = await import('../src/models')
  const gridFSBucketDecisions = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName: 'decisions_files' })

  const files = fs.readdirSync(DECISIONS_DIR)
  console.log(`Found ${files.length} files to migrate`)

  for (const file of files) {
    try {
      const filePath = path.join(DECISIONS_DIR, file)
      const fileBuffer = fs.readFileSync(filePath)
      
      // Extract docId from filename
      const docId = file.replace(/\.[^/.]+$/, '')
      
      // Find document in MongoDB
      const doc = await DecisionFile.findById(docId)
      if (!doc) {
        console.log(`⚠️  Decision file not found: ${file}`)
        continue
      }

      // Check if already migrated
      if (doc.gridfsFileId) {
        console.log(`✓ Already migrated: ${file}`)
        continue
      }

      // Upload to GridFS
      const uploadStream = gridFSBucketDecisions.openUploadStream(docId, {
        metadata: {
          docId,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
          migratedAt: new Date(),
        },
      })

      uploadStream.end(fileBuffer)

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve)
        uploadStream.on('error', reject)
      })

      // Update document with GridFS file ID
      doc.gridfsFileId = uploadStream.id
      await doc.save()

      console.log(`✅ Migrated: ${file} (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)`)
    } catch (err) {
      console.error(`❌ Error migrating ${file}:`, err)
    }
  }
}

async function migrateActivityFiles() {
  console.log('\n📂 Migrating activity media files...')
  
  if (!fs.existsSync(ACTIVITIES_DIR)) {
    console.log('⚠️  Activities directory not found, skipping')
    return
  }

  const { CenterActivity } = await import('../src/models')
  const gridFSBucketActivities = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName: 'activities_files' })

  const activityDirs = fs.readdirSync(ACTIVITIES_DIR)
  console.log(`Found ${activityDirs.length} activity directories`)

  for (const activityId of activityDirs) {
    const activityPath = path.join(ACTIVITIES_DIR, activityId)
    if (!fs.statSync(activityPath).isDirectory()) continue

    const mediaFiles = fs.readdirSync(activityPath)
    
    for (const mediaFile of mediaFiles) {
      try {
        const filePath = path.join(activityPath, mediaFile)
        const fileBuffer = fs.readFileSync(filePath)
        
        // Extract mediaId from filename
        const mediaId = mediaFile.replace(/\.[^/.]+$/, '')
        
        // Find activity in MongoDB
        const activity = await CenterActivity.findById(activityId)
        if (!activity) {
          console.log(`⚠️  Activity not found: ${activityId}`)
          continue
        }

        // Find media in activity
        const media = activity.media.find((m: any) => m._id.toString() === mediaId)
        if (!media) {
          console.log(`⚠️  Media not found in activity: ${mediaFile}`)
          continue
        }

        // Check if already migrated
        if ((media as any).gridfsFileId) {
          console.log(`✓ Already migrated: ${mediaFile}`)
          continue
        }

        // Upload to GridFS
        const uploadStream = gridFSBucketActivities.openUploadStream(`${activityId}_${mediaId}`, {
          metadata: {
            activityId,
            mediaId,
            fileName: media.fileName,
            mimeType: media.mimeType,
            migratedAt: new Date(),
          },
        })

        uploadStream.end(fileBuffer)

        await new Promise((resolve, reject) => {
          uploadStream.on('finish', resolve)
          uploadStream.on('error', reject)
        })

        // Update media with GridFS file ID
        media.gridfsFileId = uploadStream.id
        await activity.save()

        console.log(`✅ Migrated: ${mediaFile} (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)`)
      } catch (err) {
        console.error(`❌ Error migrating ${mediaFile}:`, err)
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting file migration to GridFS...\n')
  
  await connectDB()
  
  try {
    await migrateDocstoreFiles()
    await migrateDecisionFiles()
    await migrateActivityFiles()
    
    console.log('\n✅ Migration completed!')
  } catch (err) {
    console.error('❌ Migration failed:', err)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

main()
