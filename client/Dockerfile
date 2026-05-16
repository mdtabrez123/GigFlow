# ─────────────────────────────────────────────────────────────────────────────
# client/Dockerfile
# Multi-stage build for the Vite + React + TypeScript frontend
# ─────────────────────────────────────────────────────────────────────────────

# ╔══════════════════════════════════════════════════════════════╗
# ║  Stage 1 — BUILD                                            ║
# ║  Install dependencies and run `vite build`                  ║
# ╚══════════════════════════════════════════════════════════════╝
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files for layer caching
COPY package.json package-lock.json ./

# Install all dependencies (Vite, TypeScript, etc.)
RUN npm ci

# Copy all source files
COPY . .

# Build the production bundle into /app/dist
RUN npm run build


# ╔══════════════════════════════════════════════════════════════╗
# ║  Stage 2 — SERVE                                            ║
# ║  Serve the static bundle with nginx (tiny, production-ready) ║
# ╚══════════════════════════════════════════════════════════════╝
FROM nginx:1.27-alpine AS production

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the Vite build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a custom nginx config that:
#   - Serves index.html for all routes (React Router SPA support)
#   - Proxies /api requests to the backend container
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (mapped to a host port in docker-compose)
EXPOSE 80

# Nginx starts automatically via its own entrypoint
CMD ["nginx", "-g", "daemon off;"]
