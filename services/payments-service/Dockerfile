FROM node:18-bullseye-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production=false || npm install

COPY prisma ./prisma
COPY . .
RUN npx prisma generate

# Build TypeScript to `dist` so `npm start` can run the compiled file
RUN npm run build || true

EXPOSE 6100

# Ensure the compiled server is present; if not, fall back to running TS directly in dev
CMD ["sh","-c","if [ -f dist/server.js ]; then node dist/server.js; else npx ts-node-dev --respawn --transpile-only src/server.ts; fi"]
