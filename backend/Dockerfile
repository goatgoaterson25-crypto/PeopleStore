FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx prisma generate || true

EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && npm run dev"]
