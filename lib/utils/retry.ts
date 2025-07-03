import { logger } from './logger';
import { errorHandler, AppError } from './error-handler';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  shouldRetry?: (error: AppError) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  shouldRetry: (error: AppError) => errorHandler.isRetryableError(error),
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
  context?: string
): Promise<T> {
  const config = { ...defaultOptions, ...options };
  let lastError: AppError;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      logger.debug(`Attempt ${attempt}/${config.maxAttempts}`, undefined, context);
      return await operation();
    } catch (error) {
      lastError = errorHandler.handle(error as Error, context);
      
      if (attempt === config.maxAttempts || !config.shouldRetry(lastError)) {
        logger.error(`Operation failed after ${attempt} attempts`, { error: lastError }, context);
        throw lastError;
      }

      const delay = Math.min(
        config.delay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, { error: lastError.message }, context);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}