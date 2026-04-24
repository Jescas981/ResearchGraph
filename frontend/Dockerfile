# syntax=docker/dockerfile:1
# Build: vite.cloudrun.env (deploy-cloud-run-frontend.sh) → public/runtime-config.js
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN node scripts/gen-runtime-config.cjs
RUN npm run build:docker

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
