# build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Use npm install here to avoid requiring a lockfile during Docker build
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY . .
RUN npm run build

# production stage
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
