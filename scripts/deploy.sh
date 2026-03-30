#!/bin/bash

# TVU GDQP Admin - Docker Deployment Script

set -e

echo "🚀 Starting TVU GDQP Admin Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check environment files
echo -e "${YELLOW}📋 Checking environment files...${NC}"

if [ ! -f "backend-node/.env" ]; then
    echo -e "${YELLOW}⚠️  backend-node/.env not found. Copying from .env.example...${NC}"
    cp backend-node/.env.example backend-node/.env
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env not found. Copying from .env.example...${NC}"
    cp frontend/.env.example frontend/.env
fi

if [ ! -f "backend-python/.env.example" ]; then
    echo -e "${YELLOW}⚠️  backend-python/.env.example not found.${NC}"
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down

# Build images
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose build --no-cache

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check service status
echo -e "${YELLOW}📊 Checking service status...${NC}"
docker-compose ps

# Show logs
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo "Services are running at:"
echo "  - Frontend:        http://localhost"
echo "  - Backend Node:    http://localhost:3000"
echo "  - Backend Python:  http://localhost:8000"
echo "  - Mongo Express:   http://localhost:8081"
echo "  - pgAdmin:         http://localhost:5050"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
