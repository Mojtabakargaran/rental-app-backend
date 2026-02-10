import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // Server
  PORT: Joi.number().default(3001),
  GRPC_PORT: Joi.number().default(50051),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(true),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Bcrypt
  BCRYPT_ROUNDS: Joi.number().default(12),

  // Verification Token
  VERIFICATION_TOKEN_EXPIRATION_HOURS: Joi.number().default(24),

  // Reset Token
  RESET_TOKEN_EXPIRATION_HOURS: Joi.number().default(1),
  MAX_RESET_REQUESTS_PER_EMAIL: Joi.number().default(3),
  MAX_RESET_REQUESTS_PER_IP: Joi.number().default(10),

  // Session
  SESSION_SHORT_TTL_HOURS: Joi.number().default(24),
  SESSION_LONG_TTL_DAYS: Joi.number().default(30),
  SESSION_TEMP_TTL_MINUTES: Joi.number().default(15),
  MAX_FAILED_ATTEMPTS: Joi.number().default(5),
  RATE_LIMIT_WINDOW_MINUTES: Joi.number().default(15),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),

  // RabbitMQ
  RABBITMQ_URL: Joi.string().required(),
  RABBITMQ_USER: Joi.string().required(),
  RABBITMQ_PASS: Joi.string().required(),
  RABBITMQ_EXCHANGE: Joi.string().default('rental-app.events'),

  // gRPC Services
  USER_SERVICE_URL: Joi.string().required(),
  TENANT_SERVICE_URL: Joi.string().required(),

  // Application
  APP_NAME: Joi.string().default('Auth Service'),
  APP_VERSION: Joi.string().default('1.0.0'),
});
