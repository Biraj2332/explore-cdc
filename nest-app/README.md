# 🚀 NestJS CDC Consumer for NATS JetStream

This service consumes Change Data Capture (CDC) events from Debezium via NATS JetStream.

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- NATS Server with JetStream enabled
- Debezium Server configured for MySQL

## 🏗️ Architecture
MySQL → Debezium → NATS JetStream → NestJS Consumer


## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NATS_URL` | NATS server URL | `nats://localhost:4222` |
| `CDC_SUBJECT` | NATS subject to subscribe | `mydb.users` |
| `PORT` | HTTP port for health checks | `3000` |
| `NODE_ENV` | Environment | `production` |

## 🚀 Running with Docker

1. **Build and start the consumer:**
```bash
docker compose -f docker-compose.nest.yml up -d