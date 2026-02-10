import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3004),
  
  // Email Configuration
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_SECURE: Joi.boolean().default(false),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),
  EMAIL_FROM: Joi.string().required(),
  EMAIL_VERIFICATION_URL: Joi.string().uri().required(),
  
  // RabbitMQ Configuration
  RABBITMQ_URL: Joi.string().required(),
  RABBITMQ_USER: Joi.string().required(),
  RABBITMQ_PASS: Joi.string().required(),
  RABBITMQ_EXCHANGE: Joi.string().default('rental-app.events'),
  
  // Retry Configuration
  EMAIL_MAX_RETRIES: Joi.number().default(3),
  EMAIL_RETRY_DELAY: Joi.number().default(5000),
  EMAIL_SEND_TIMEOUT: Joi.number().default(30000),
  
  // Application Configuration
  APP_NAME: Joi.string().default('Notification Service'),
  APP_VERSION: Joi.string().default('1.0.0'),
});
