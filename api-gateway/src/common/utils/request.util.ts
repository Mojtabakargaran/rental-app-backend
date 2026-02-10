import { v4 as uuidv4 } from 'uuid';

export function generateCorrelationId(): string {
  return uuidv4();
}

export function extractIpAddress(request: any): string {
  return (
    request.headers['x-forwarded-for']?.split(',')[0] ||
    request.headers['x-real-ip'] ||
    request.connection?.remoteAddress ||
    request.ip ||
    'unknown'
  );
}

export function extractUserAgent(request: any): string {
  return request.headers['user-agent'] || 'unknown';
}
