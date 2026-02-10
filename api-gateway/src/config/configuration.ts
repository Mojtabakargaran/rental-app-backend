export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  csrf: {
    secret: process.env.CSRF_SECRET,
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '3600', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '5', 10),
  },
  grpc: {
    authService: {
      url: process.env.AUTH_SERVICE_URL || 'localhost:50051',
      package: 'auth',
      protoPath: 'proto/auth.proto',
    },
    userService: {
      url: process.env.USER_SERVICE_URL || 'localhost:50052',
      package: 'user',
      protoPath: 'proto/user.proto',
    },
    tenantService: {
      url: process.env.TENANT_SERVICE_URL || 'localhost:50053',
      package: 'tenant',
      protoPath: 'proto/tenant.proto',
    },
    equipmentService: {
      url: process.env.EQUIPMENT_SERVICE_URL || 'localhost:50056',
      package: 'equipment',
      protoPath: 'proto/equipment.proto',
    },
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
});
