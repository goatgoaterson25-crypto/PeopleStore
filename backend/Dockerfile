FROM node:20-alpine
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm install
COPY backend/ .
RUN npx prisma generate || true
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && npm run dev"]
