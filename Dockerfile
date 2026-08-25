# ==========================================
# BUILDER STAGE
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time environment variables for Vite
ARG VITE_BASE_URL=http://localhost:8080
ARG VITE_APP_NAME=NetBase

ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV TZ=Asia/Jakarta

RUN npm run build

# ==========================================
# RUNNER STAGE
# ==========================================
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
