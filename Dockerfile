# Multi-stage build for optimal image size
FROM node:25.9.0-alpine AS builder

WORKDIR /app

# Copy dependency files first (better layer caching)
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript application
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

ARG ADMIN_PASSWORD=debug
RUN apk add --no-cache sudo shadow \
    && echo '%wheel ALL=(ALL) NOPASSWD: ALL' > /etc/sudoers.d/wheel \
    && chmod 440 /etc/sudoers.d/wheel \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 \
    && adduser -D -u 2000 admin \
    && adduser admin wheel \
    && adduser admin nodejs \
    && echo "admin:${ADMIN_PASSWORD}" | chpasswd \
    && chown -R nodejs:nodejs /app

USER nodejs

# Expose port (matches docker-compose.yml)
EXPOSE 8090

# Start application
CMD ["node", "dist/src/index.js"]
