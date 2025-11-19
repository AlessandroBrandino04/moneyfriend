FROM node:18-bullseye-slim

WORKDIR /app

# Installa le dipendenze di sistema necessarie per Prisma (openssl)
RUN apt-get update -y && apt-get install -y openssl

# Copia i file delle dipendenze
COPY package.json package-lock.json ./

# Installa TUTTE le dipendenze (inclusi i devDependencies come ts-node-dev)
RUN npm install

# Copia tutto il codice sorgente
COPY . .

# Genera il client Prisma (crea i binari per Linux)
RUN npx prisma generate

# Espone la porta
EXPOSE 5000

# Avvia in modalità sviluppo
CMD ["npm", "run", "dev"]