# ─────────────────────────────────────────────
# Stage 1: Builder
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package manifests and install deps first (layer cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy full source
COPY . .

# NEXT_PUBLIC_* vars are inlined at build time.
# Values are injected by docker-compose from the root .env file.
# No hardcoded defaults — fail fast if a required var is missing.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG GROQ_API_KEY
ARG CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME \
    GROQ_API_KEY=$GROQ_API_KEY \
    CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY \
    CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET

# Build for production
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Runtime
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy deps + built output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["npm", "run", "start"]
