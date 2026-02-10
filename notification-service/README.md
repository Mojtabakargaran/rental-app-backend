# Notification Service

Email notification service for the equipment rental platform. Handles email delivery for user verification, password reset, and other transactional emails.

## Features

- **Email Verification**: Send verification emails to new users
- **Multi-language Support**: English and Persian (RTL) email templates
- **Event-driven**: Consumes events from RabbitMQ
- **Retry Logic**: Automatic retry with exponential backoff
- **Template Engine**: Handlebars for email templating

## Architecture

The notification service is stateless and event-driven:
1. Consumes events from RabbitMQ
2. Selects appropriate email template based on language
3. Renders template with event data
4. Sends email via SMTP
5. Publishes failure events if needed
6. Acknowledges message after processing
