/**
 * Structured logging utility
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, meta?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...this.context,
      ...meta,
    };

    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'debug':
        console.debug(logMessage, meta || '');
        break;
      case 'info':
        console.info(logMessage, meta || '');
        break;
      case 'warn':
        console.warn(logMessage, meta || '');
        break;
      case 'error':
        console.error(logMessage, meta || '');
        break;
    }

    // In production, send to logging service (e.g., Datadog, CloudWatch)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to logging service
    }
  }

  debug(message: string, meta?: LogContext) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: LogContext) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: LogContext) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: LogContext) {
    this.log('error', message, meta);
  }

  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context });
  }
}

export const logger = new Logger({ service: 'solva-dashboard' });
