# 1) Bygg steg
FROM node:18-alpine AS builder
WORKDIR /app

# Kopier kun package.json
COPY package.json ./

# Installer avhengigheter (lager package-lock automatisk)
RUN npm install
RUN npm install @react-google-maps/api

#RUN npm install react react-dom react-leaflet leaflet \
#    --save \
#    --legacy-peer-deps

# Kopier resten av koden
COPY . .

# Bygg appen
RUN npm run build

# 2) Kjør steg med nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
