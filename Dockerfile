# 1) Bygg steg
FROM node:18-alpine AS builder
WORKDIR /app

# Kopier kun package.json
COPY package.json ./

# Installer avhengigheter (lager package-lock automatisk)
RUN npm install

# Kopier resten av koden
COPY . .

# Bygg appen
RUN npm run build

# 2) Kjør steg med Node.js server
FROM node:18-alpine
WORKDIR /app

# Kopier package.json og installer dependencies
COPY package.json ./
RUN npm install --production

# Kopier bygget app og server
COPY --from=builder /app/dist ./dist
COPY server.js ./

EXPOSE 3000
CMD ["npm", "start"]
