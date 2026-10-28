FROM node:22-alpine AS dependencies

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM dependencies AS builder

WORKDIR /app
ARG NEXT_PUBLIC_API_URL=/api
ARG API_INTERNAL_URL=http://api:4000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    API_INTERNAL_URL=${API_INTERNAL_URL} \
    NEXT_TELEMETRY_DISABLED=1

COPY tsconfig.base.json ./
COPY apps/web ./apps/web
RUN npm run build -w @hbba/web

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
