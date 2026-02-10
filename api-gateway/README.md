# API Gateway Service

API Gateway for Equipment Rental Management Platform. Routes client requests to appropriate microservices via gRPC.

## Features
- REST API endpoints for client applications
- gRPC client for auth-service communication
- Request validation and transformation
- Global exception filters
- Rate limiting (5 requests per hour for registration)
- CSRF protection
- Request logging and correlation IDs
- Swagger documentation

## Project Structure
```
src/
├── common/
│   ├── filters/           # Exception filters
│   ├── interceptors/      # Request/response interceptors
│   ├── middleware/        # Custom middleware
│   └── utils/             # Utility functions
├── config/                # Configuration files
├── modules/
│   └── auth/              # Authentication module
│       ├── dto/           # Data Transfer Objects
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       └── auth.module.ts
├── app.module.ts          # Root module
└── main.ts                # Application entry point
proto/
└── auth.proto             # gRPC proto definitions
```
