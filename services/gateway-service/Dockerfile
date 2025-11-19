# Builder stage
FROM node:18-bullseye-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY server.ts ./

RUN npm run build

# Production stage
FROM node:18-bullseye-slim
WORKDIR /app

RUN groupadd -r app && useradd -r -g app app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN chown -R app:app /app
USER app

EXPOSE 8000
CMD ["node", "dist/server.js"]