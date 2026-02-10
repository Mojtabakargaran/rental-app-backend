import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Server Configuration
  port: parseInt(process.env.PORT || '3002', 10),
  grpcPort: parseInt(process.env.GRPC_PORT || '50052', 10),
  environment: process.env.NODE_ENV || 'development',

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'user_db',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },

  // RabbitMQ Configuration
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'rental-app.events',
    userEventsQueue: 'user_events',
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  // Service Configuration
  serviceName: 'user-service',
  logLevel: process.env.LOG_LEVEL || 'info',
}));
