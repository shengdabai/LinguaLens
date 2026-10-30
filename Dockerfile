# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production with deterministic server
FROM node:20-alpine

WORKDIR /app

# Install serve as a dependency (not npx)
RUN npm install -g serve@14

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public/robots.txt ./dist/
COPY --from=builder /app/public/sitemap.xml ./dist/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["serve", "dist", "-l", "3000", "--no-clipboard", "--cors"]
