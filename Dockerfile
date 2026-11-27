# Client build stage
FROM oven/bun:1.4.5 AS client-builder
WORKDIR /app/client
COPY client/package.json client/bun.lock ./
RUN bun install --frozen-lockfile
COPY client ./
RUN bun run build

# Server dependencies. Both lock files are frozen, so a build always gets the same packages.
FROM oven/bun:1.4.5 AS server-deps
WORKDIR /app/server
COPY server/package.json server/bun.lock ./
RUN bun install --frozen-lockfile --production

# Runtime stage. Bun runs the TypeScript server directly, so the server has no build step.
FROM oven/bun:1.4.5-alpine AS release
WORKDIR /app

# Copy server node_modules from the dependencies stage
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY --from=server-deps /app/server/package.json ./server/package.json

# Copy source code
COPY server ./server

# Copy built client assets
COPY --from=client-builder /app/client/dist ./client/dist

# The SQLite database lives here. docker-compose mounts a host folder on it.
RUN mkdir -p /app/data

# Environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

WORKDIR /app/server

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "const ok = await fetch('http://127.0.0.1:' + (process.env.PORT ?? 3001) + '/api/health').then((response) => response.ok).catch(() => false); process.exit(ok ? 0 : 1)"

# Run with Bun
CMD ["bun", "index.ts"]
