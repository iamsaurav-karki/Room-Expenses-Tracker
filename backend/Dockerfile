# Backend Dockerfile for Room Expense Tracker
FROM node:20-alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Production image
FROM base AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Run database migrations and start the server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node prisma/seed.js && npm start"]

