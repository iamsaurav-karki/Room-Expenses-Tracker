# Frontend build Dockerfile for Room Expense Tracker
FROM node:20-alpine AS base

# Install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the Vite app
RUN npm run build

# Output directory /app/dist can be copied to system Nginx

