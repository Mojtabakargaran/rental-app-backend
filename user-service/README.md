# User Service

User Management microservice for the Equipment Rental Platform. Handles user registration, role management, and user-related operations.

## Features

- User account management
- Role-based access control (RBAC)
- Email verification support
- Multi-tenant user isolation
- gRPC-based inter-service communication

## Project Structure

```
src/
├── config/              # Configuration files
├── entities/            # TypeORM entities
├── migrations/          # Database migrations
├── dto/                 # Data transfer objects
├── services/            # Business logic
├── controllers/         # gRPC and HTTP controllers
├── events/              # Event publishing
├── common/
│   └── filters/         # Exception filters
├── app.module.ts        # Root module
└── main.ts              # Application entry point
```

