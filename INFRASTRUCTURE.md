# Backend Infrastructure

This directory contains Docker Compose configuration for running backend infrastructure services.

## Infrastructure Services

### PostgreSQL (Port 5432)
- **Version:** 16 Alpine
- **User:** postgres
- **Password:** kargaran1367
- **Databases:**
  - `auth_db` - Auth Service database
  - `user_db` - User Service database
  - `tenant_db` - Tenant Service database
  - `audit_db` - Audit Service database

### RabbitMQ (Ports 5672, 15672)
- **Version:** 3.12 Management Alpine
- **User:** admin
- **Password:** kargaran1367
- **AMQP Port:** 5672
- **Management UI:** http://localhost:15672

### Redis (Port 6379)
- **Version:** 7 Alpine
- **Persistence:** AOF enabled

## Usage

### Start Infrastructure
```bash
docker-compose up -d
```

### Stop Infrastructure
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f [service-name]
```

### Restart Services
```bash
docker-compose restart [service-name]
```

### Remove All Data (WARNING: Destructive)
```bash
docker-compose down -v
```

## Access Points

- **PostgreSQL:** localhost:5432
- **RabbitMQ AMQP:** localhost:5672
- **RabbitMQ Management:** http://localhost:15672 (admin/kargaran1367)
- **Redis:** localhost:6379

## Health Checks

All services include health checks:
- PostgreSQL: `pg_isready`
- RabbitMQ: `rabbitmq-diagnostics ping`
- Redis: `redis-cli ping`

## Notes

- Services run on a shared `rental-network` bridge network
- Data persists in Docker volumes
- `init-databases.sql` automatically creates service databases on first run
- All services set to restart unless stopped manually
