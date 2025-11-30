# syntax=docker/dockerfile:1.7

############################
# Base build image
############################
FROM oven/bun:slim AS build-base

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends netcat-traditional && \
    rm -rf /var/lib/apt/lists/*

############################
# Dependencies
############################
FROM build-base AS deps

COPY bun.lock* package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

############################
# Frontend build
############################
FROM build-base AS frontend-builder

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./
COPY frontend ./frontend
COPY backend ./backend

RUN cd frontend && bun run build

############################
# Backend build
############################
FROM build-base AS backend-builder

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./
COPY backend ./backend

RUN cd backend && bun run build

############################
# Runtime image
############################
FROM gcr.io/distroless/cc:nonroot AS runtime

WORKDIR /app

COPY --from=build-base /bin/nc.traditional /usr/bin/nc
COPY --from=backend-builder /app/build/ .
COPY --from=frontend-builder /app/build/ .

EXPOSE 3000

ENTRYPOINT ["/app/vlab"]
