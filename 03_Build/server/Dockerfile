# Pharmacy Compliance API — production image
FROM node:20-alpine AS base
WORKDIR /app

# Install deps
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# Generate Prisma client (no DB needed)
FROM base AS prisma
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# Production runner
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY package*.json ./
COPY prisma ./prisma/
COPY src ./src/

# Wait for DB and run migrations then start (override CMD for custom entrypoint)
RUN apk add --no-cache dumb-init
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/docker-entrypoint.sh"]
