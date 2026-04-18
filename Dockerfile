# Multi-stage build for optimal image size
FROM node:25.9.0-alpine AS builder

WORKDIR /app


COPY package*.json ./


RUN npm install


COPY . .


RUN npm run build

# Production stage
FROM node:25.9.0-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --quiet && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy any additional runtime files if needed
COPY --from=builder /app/scripts ./scripts

# Create nodejs user and set ownership
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 \
    && chown -R nodejs:nodejs /app

USER nodejs

# Expose port (matches docker-compose.yml)
EXPOSE 8090

# Start application
CMD ["npm", "start"]
