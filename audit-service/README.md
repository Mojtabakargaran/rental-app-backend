# Audit Service

Audit logging service for the Equipment Rental Management Platform.

## Overview

The Audit Service is responsible for capturing and storing audit trails for all significant system events. It consumes events from RabbitMQ and stores them in a PostgreSQL database for compliance, troubleshooting, and monitoring purposes.

## Features

- **Event-Driven Architecture**: Consumes events from RabbitMQ message broker
- **Comprehensive Logging**: Tracks user registrations, failures, and email delivery issues
- **Correlation Tracking**: Links related events across services using correlation IDs
- **Data Retention**: Configurable retention policy (default: 90 days)
- **High Performance**: Indexed queries for fast retrieval
- **Audit Trail**: Immutable logs for compliance and security auditing

## Service Architecture

```
audit-service/
├── src/
│   ├── config/               # Configuration files
│   │   ├── configuration.ts  # Environment configuration
│   │   ├── validation.schema.ts  # Env validation
│   │   └── typeorm.config.ts # TypeORM configuration
│   ├── controllers/          # HTTP controllers
│   │   └── health.controller.ts
│   ├── entities/             # TypeORM entities
│   │   └── audit-log.entity.ts
│   ├── events/               # Event handling
│   │   └── event-consumer.service.ts
│   ├── interfaces/           # TypeScript interfaces
│   │   └── events.interface.ts
│   ├── migrations/           # Database migrations
│   │   └── 1729468800000-CreateAuditLogs.ts
│   ├── services/             # Business logic
│   │   └── audit.service.ts
│   ├── app.module.ts         # Main application module
│   └── main.ts               # Application entry point
```