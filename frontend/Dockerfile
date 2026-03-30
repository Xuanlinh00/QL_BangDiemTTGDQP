# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Install envsubst for dynamic config
RUN apk add --no-cache gettext

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Create entrypoint script
RUN echo '#!/bin/sh\n\
export PORT=${PORT:-8080}\n\
envsubst '\''${PORT}'\'' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf\n\
exec nginx -g "daemon off;"' > /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Expose port (default for local)
EXPOSE 8080

# Start with entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
