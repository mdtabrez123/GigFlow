# ─────────────────────────────────────────────────────────────────────────────
# backend/Dockerfile
# Multi-stage build for the Node.js + Express + TypeScript backend
# ─────────────────────────────────────────────────────────────────────────────

# ╔══════════════════════════════════════════════════════════════╗
# ║  Stage 1 — BUILD                                            ║
# ║  Install all deps (including devDependencies) and compile    ║
# ║  TypeScript to plain JavaScript in /app/dist                 ║
# ╚══════════════════════════════════════════════════════════════╝
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
# (Only reinstalls node_modules when package files change)
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDeps needed for tsc)
RUN npm ci

# Copy the rest of the source code
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript → JavaScript
RUN npm run build


# ╔══════════════════════════════════════════════════════════════╗
# ║  Stage 2 — PRODUCTION                                       ║
# ║  Copy only the compiled output and production dependencies   ║
# ║  into a lean final image (no TypeScript, no source maps)     ║
# ╚══════════════════════════════════════════════════════════════╝
FROM node:22-alpine AS production

# Install dumb-init for proper PID 1 signal handling in containers
RUN apk add --no-cache dumb-init

WORKDIR /app

# Set NODE_ENV before installing deps (affects npm ci behaviour)
ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json ./

# Install ONLY production dependencies (skip devDeps)
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from the builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 expressjs
USER expressjs

# Expose the API port (matches PORT in .env)
EXPOSE 5000

# Use dumb-init as PID 1 to forward signals correctly (SIGTERM → graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
