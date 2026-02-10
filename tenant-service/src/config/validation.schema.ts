import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3003),
  GRPC_PORT: Joi.number().default(50053),
  
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  
  RABBITMQ_URL: Joi.string().required(),
  RABBITMQ_USER: Joi.string().required(),
  RABBITMQ_PASS: Joi.string().required(),
  RABBITMQ_EXCHANGE: Joi.string().default('rental-app.events'),
  
  USER_SERVICE_GRPC_URL: Joi.string().required(),
  
  APP_NAME: Joi.string().default('Tenant Service'),
  APP_VERSION: Joi.string().default('1.0.0'),
});
