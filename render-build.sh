#!/bin/bash

# Render Build Script for Frontend

set -e

echo "🚀 Starting Render build..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build application
echo "🔨 Building application..."
npm run build

echo "✅ Build completed successfully!"
