import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  JWT_SECRET: Joi.string().required(),
  CSRF_SECRET: Joi.string().required(),
  RATE_LIMIT_TTL: Joi.number().default(3600),
  RATE_LIMIT_MAX: Joi.number().default(5),
  AUTH_SERVICE_URL: Joi.string().required(),
  USER_SERVICE_URL: Joi.string().optional(),
  TENANT_SERVICE_URL: Joi.string().optional(),
  EQUIPMENT_SERVICE_URL: Joi.string().optional(),
  CORS_ORIGIN: Joi.string().required(),
});
