# Deployment Guide

## Prerequisites
- Docker & Docker Compose
- Node.js 20+
- PostgreSQL 16
- Redis 7

## Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/PeopleStore.git
cd PeopleStore

# Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start services
docker-compose up -d

# Run migrations
docker exec peoplestore-api npm run migrate
```

## Production Deployment

### Using Docker
```bash
docker-compose -f docker-compose.yml up -d
```

### Using Kubernetes
```bash
kubectl apply -f k8s/
```

### Environment Variables
Set these in production:
- `NODE_ENV=production`
- `JWT_SECRET=<strong-secret>`
- `DB_PASSWORD=<secure-password>`
- `AWS_ACCESS_KEY_ID=<your-key>`
- `AWS_SECRET_ACCESS_KEY=<your-secret>`

## Monitoring
- API health: `/health`
- Logs: `docker logs -f peoplestore-api`
- Database: pgAdmin on `http://localhost:5050`
