export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  grpcPort: parseInt(process.env.GRPC_PORT || '50051', 10),
  
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  
  verificationToken: {
    expirationHours: parseInt(process.env.VERIFICATION_TOKEN_EXPIRATION_HOURS || '24', 10),
  },

  resetToken: {
    expirationHours: parseInt(process.env.RESET_TOKEN_EXPIRATION_HOURS || '1', 10),
    maxRequestsPerEmail: parseInt(process.env.MAX_RESET_REQUESTS_PER_EMAIL || '3', 10),
    maxRequestsPerIp: parseInt(process.env.MAX_RESET_REQUESTS_PER_IP || '10', 10),
  },
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
    user: process.env.RABBITMQ_USER,
    pass: process.env.RABBITMQ_PASS,
    exchange: process.env.RABBITMQ_EXCHANGE || 'rental-app.events',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  
  session: {
    shortTtlHours: parseInt(process.env.SESSION_SHORT_TTL_HOURS || '24', 10),
    longTtlDays: parseInt(process.env.SESSION_LONG_TTL_DAYS || '30', 10),
    tempTtlMinutes: parseInt(process.env.SESSION_TEMP_TTL_MINUTES || '15', 10),
    maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10),
    rateLimitWindowMinutes: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10),
  },
  
  grpcServices: {
    userService: process.env.USER_SERVICE_URL,
    tenantService: process.env.TENANT_SERVICE_URL,
  },
  
  app: {
    name: process.env.APP_NAME || 'Auth Service',
    version: process.env.APP_VERSION || '1.0.0',
  },
});
