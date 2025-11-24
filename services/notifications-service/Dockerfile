FROM node:18-bullseye-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production=false || npm install

# Copy source
COPY . .

EXPOSE 6000

CMD ["npm", "run", "start"]
