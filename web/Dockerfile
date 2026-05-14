# syntax=docker/dockerfile:1.7

# ---------- builder ----------
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable

# install deps with a stable cache
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# build
COPY . .
RUN pnpm build

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O- http://127.0.0.1/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
