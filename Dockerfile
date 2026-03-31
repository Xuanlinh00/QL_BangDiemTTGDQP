# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend-node directory
COPY backend-node ./

# Install dependencies
RUN npm ci

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend-node/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads/activities uploads/decisions

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/app.js"]
