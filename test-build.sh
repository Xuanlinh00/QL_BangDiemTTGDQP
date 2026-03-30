#!/bin/bash

# Script to test build locally before deploying to Render

echo "🧪 Testing Render build process locally..."
echo ""

cd backend-node || exit 1

echo "📦 Installing dependencies (including devDependencies)..."
npm install --include=dev

if [ $? -ne 0 ]; then
  echo "❌ npm install failed"
  exit 1
fi

echo ""
echo "🔨 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "📁 Build output:"
ls -lh dist/

echo ""
echo "🎉 Ready to deploy to Render!"
echo ""
echo "Next steps:"
echo "1. Commit and push to GitHub"
echo "2. Setup MongoDB Atlas (see HUONG_DAN_MONGODB_ATLAS.md)"
echo "3. Configure Render environment variables"
echo "4. Deploy on Render"
