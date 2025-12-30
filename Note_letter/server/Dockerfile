# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for TypeScript build)
RUN npm ci

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript to JavaScript
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Prune dev dependencies for smaller image
RUN npm prune --production

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "dist/index.js"]
