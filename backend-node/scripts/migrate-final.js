/**
 * Final migration: Move files from disk to GridFS
 * Compile TypeScript first, then run this script
 */

const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

// Import compiled models
const { DocumentModel } = require('../dist/models')

const UPLOADS_DIR = path.resolve(__dirname, '../uploads/docstore')

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/docstore')
    console.log('✅ Connected to MongoDB')

    const gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'docstore_files' })

    if (!fs.existsSync(UPLOADS_DIR)) {
      console.log('⚠️  Docstore directory not found')
      process.exit(0)
    }

    const files = fs.readdirSync(UPLOADS_DIR)
    console.log(`\n📂 Found ${files.length} files to migrate\n`)

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const file of files) {
      try {
        const filePath = path.join(UPLOADS_DIR, file)
        const fileBuffer = fs.readFileSync(filePath)
        const docId = file.replace(/\.[^/.]+$/, '')

        // Find document
        const doc = await DocumentModel.findById(docId)
        if (!doc) {
          console.log(`⚠️  Document not found: ${file}`)
          skipped++
          continue
        }

        // Check if already migrated
        if (doc.gridfsFileId) {
          console.log(`✓ Already migrated: ${file}`)
          skipped++
          continue
        }

        // Upload to GridFS
        const uploadStream = gridFSBucket.openUploadStream(docId, {
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

        // Update document
        doc.gridfsFileId = uploadStream.id
        await doc.save()

        console.log(`✅ Migrated: ${file} (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)`)
        migrated++
      } catch (err) {
        console.error(`❌ Error: ${file} - ${err.message}`)
        errors++
      }
    }

    console.log(`\n📊 Summary: ${migrated} migrated, ${skipped} skipped, ${errors} errors`)
    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('❌ Fatal error:', err.message)
    process.exit(1)
  }
}

main()
