# Multi-stage build for Group Running App (frontend + backend)

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
ENV VITE_API_URL=
ENV VITE_WS_URL=
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

COPY backend/ ./
RUN npm run build
 
# Ensure SQL migrations are available in the compiled `dist/` folder.
# `tsc` only compiles TypeScript; it does not copy `.sql` assets.
RUN mkdir -p dist/database/migrations && cp -r src/database/migrations/* dist/database/migrations/

# Stage 3: Production image
FROM node:20-alpine
WORKDIR /app

COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=frontend-builder /app/frontend/dist ./public

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "dist/index.js"]
