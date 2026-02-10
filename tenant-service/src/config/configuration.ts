export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3003', 10),
  grpcPort: parseInt(process.env.GRPC_PORT || '50053', 10),
  
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
    user: process.env.RABBITMQ_USER,
    pass: process.env.RABBITMQ_PASS,
    exchange: process.env.RABBITMQ_EXCHANGE || 'rental-app.events',
  },

  grpcServices: {
    user: {
      url: process.env.USER_SERVICE_GRPC_URL || 'localhost:50052',
      package: 'user',
      protoPath: 'user.proto',
    },
  },
  
  app: {
    name: process.env.APP_NAME || 'Tenant Service',
    version: process.env.APP_VERSION || '1.0.0',
  },
});
