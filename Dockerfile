FROM node:20-slim

# Install build deps for better-sqlite3 native module
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install ALL deps (including dev) — needed for tsx (seed) and build tools
COPY package*.json ./
RUN npm ci

COPY . .

# Build with local DB path (volume not available at build time)
ENV DB_PATH=./data/kortex.db
RUN mkdir -p data && npm run db:migrate && npm run build

EXPOSE 8080
ENV PORT=8080
