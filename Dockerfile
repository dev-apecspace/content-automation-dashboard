# ---------- Base ----------
FROM node:22-alpine AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- Build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---------- Runtime ----------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# ?? B?T BU?C CÀI PNPM L?I
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/next.config.* ./

EXPOSE 3007

CMD ["pnpm", "start"]
