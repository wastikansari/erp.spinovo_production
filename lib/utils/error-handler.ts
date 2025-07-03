import { logger } from './logger';
import { APP_CONFIG } from '@/lib/config/constants';

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  context?: string;
  originalError?: Error;
}

export class ApiError extends Error implements AppError {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public context?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error implements AppError {
  constructor(
    message: string = 'Network error occurred',
    public statusCode: number = 0,
    public code: string = 'NETWORK_ERROR',
    public context?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error implements AppError {
  constructor(
    message: string = 'Authentication failed',
    public statusCode: number = 401,
    public code: string = 'AUTH_ERROR',
    public context?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error implements AppError {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = 'VALIDATION_ERROR',
    public context?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const errorHandler = {
  handle: (error: Error, context?: string): AppError => {
    logger.error('Error occurred', { error: error.message, stack: error.stack }, context);

    if (error instanceof ApiError || 
        error instanceof NetworkError || 
        error instanceof AuthenticationError || 
        error instanceof ValidationError) {
      return error;
    }

    // Handle fetch errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new NetworkError('Network connection failed', 0, 'FETCH_ERROR', context, error);
    }

    // Handle timeout errors
    if (error.message.includes('timeout')) {
      return new NetworkError('Request timeout', 408, 'TIMEOUT_ERROR', context, error);
    }

    // Default error
    return new ApiError(
      APP_CONFIG.isProduction ? 'An unexpected error occurred' : error.message,
      500,
      'UNKNOWN_ERROR',
      context,
      error
    );
  },

  getErrorMessage: (error: AppError): string => {
    if (APP_CONFIG.isProduction && error.statusCode === 500) {
      return 'An unexpected error occurred. Please try again later.';
    }
    return error.message;
  },

  isRetryableError: (error: AppError): boolean => {
    return error.statusCode >= 500 || error.statusCode === 0 || error.code === 'NETWORK_ERROR';
  },
};