FROM node:22-alpine AS dependencies

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM dependencies AS builder

COPY tsconfig.base.json ./
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000

COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts

WORKDIR /app/apps/api
USER node
EXPOSE 4000

CMD ["sh", "-c", "/app/node_modules/.bin/prisma migrate deploy && node dist/prisma/seed.js && exec node dist/src/index.js"]
