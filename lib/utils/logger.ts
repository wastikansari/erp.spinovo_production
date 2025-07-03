import { APP_CONFIG } from '@/lib/config/constants';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = APP_CONFIG.isDevelopment;
  private enableDebug = APP_CONFIG.enableDebug;

  private formatMessage(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    if (level === LogLevel.DEBUG && !this.enableDebug) return false;
    return level === LogLevel.ERROR || level === LogLevel.WARN;
  }

  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatMessage(level, message, data, context);
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(`[${logEntry.timestamp}] ERROR ${context ? `[${context}]` : ''}: ${message}`, data);
        break;
      case LogLevel.WARN:
        console.warn(`[${logEntry.timestamp}] WARN ${context ? `[${context}]` : ''}: ${message}`, data);
        break;
      case LogLevel.INFO:
        console.info(`[${logEntry.timestamp}] INFO ${context ? `[${context}]` : ''}: ${message}`, data);
        break;
      case LogLevel.DEBUG:
        console.debug(`[${logEntry.timestamp}] DEBUG ${context ? `[${context}]` : ''}: ${message}`, data);
        break;
    }

    // In production, you might want to send logs to a service like Sentry, LogRocket, etc.
    if (APP_CONFIG.isProduction && level === LogLevel.ERROR) {
      this.sendToErrorService(logEntry);
    }
  }

  private sendToErrorService(logEntry: LogEntry): void {
    // Implement error reporting service integration here
    // Example: Sentry, LogRocket, Bugsnag, etc.
  }

  error(message: string, data?: any, context?: string): void {
    this.log(LogLevel.ERROR, message, data, context);
  }

  warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  debug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }
}

export const logger = new Logger();