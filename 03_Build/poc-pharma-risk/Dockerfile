# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Build-time API URL: same-origin when served behind nginx proxy
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production: nginx serves static + proxies /api to backend
FROM nginx:alpine AS runner
RUN apk add --no-cache dumb-init

# Remove default config and use our own
RUN rm -rf /usr/share/nginx/html /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
