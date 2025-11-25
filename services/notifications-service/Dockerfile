FROM node:18-bullseye-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production=false || npm install

# Copy prisma schema and source
COPY prisma ./prisma
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 6000

CMD ["npm", "run", "start"]
