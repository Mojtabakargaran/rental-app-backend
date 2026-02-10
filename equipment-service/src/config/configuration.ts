export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3006', 10),
  grpcPort: parseInt(process.env.GRPC_PORT || '50056', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME || 'equipment_db',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE || 'equipment-service',
    exchange: process.env.RABBITMQ_EXCHANGE || 'rental-app.events',
    user: process.env.RABBITMQ_DEFAULT_USER || 'admin',
    password: process.env.RABBITMQ_DEFAULT_PASS,
  },
});
