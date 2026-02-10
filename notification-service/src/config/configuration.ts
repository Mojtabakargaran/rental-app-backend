export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3004', 10),
  
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
    verificationUrl: process.env.EMAIL_VERIFICATION_URL,
    passwordResetUrl: process.env.EMAIL_PASSWORD_RESET_URL || process.env.EMAIL_VERIFICATION_URL,
    loginUrl: process.env.EMAIL_LOGIN_URL || process.env.EMAIL_VERIFICATION_URL,
  },
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
    user: process.env.RABBITMQ_USER,
    pass: process.env.RABBITMQ_PASS,
    exchange: process.env.RABBITMQ_EXCHANGE || 'rental-app.events',
  },
  
  retry: {
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '5000', 10),
    sendTimeout: parseInt(process.env.EMAIL_SEND_TIMEOUT || '30000', 10),
  },
  
  app: {
    name: process.env.APP_NAME || 'Notification Service',
    version: process.env.APP_VERSION || '1.0.0',
  },
});
