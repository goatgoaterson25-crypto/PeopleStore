FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat ca-certificates

COPY backend/package.json backend/package-lock.json* ./
RUN npm install
COPY backend/ .

RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" npx prisma generate

EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && npm run dev"]
