# Auth Service

Authentication and authorization microservice for the Equipment Rental Management Platform.

## Overview

The Auth Service handles user registration, authentication, and token management. It orchestrates the registration workflow by coordinating with user-service and tenant-service, and publishes events for email verification and audit logging.

## Project Structure

```
src/
├── common/
│   └── filters/          # Exception filters
├── config/               # Configuration files
├── controllers/          # gRPC controllers
├── dto/                  # Data transfer objects
├── entities/             # TypeORM entities
├── events/               # Event publishers
├── migrations/           # Database migrations
├── services/             # Business logic and gRPC clients
├── app.module.ts         # Root module
└── main.ts              # Application bootstrap
```