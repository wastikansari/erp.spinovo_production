import { AuthService } from '../auth';
import { ApiResponse } from '../types';
import { APP_CONFIG, API_ENDPOINTS } from '../config/constants';
import { logger } from '../utils/logger';
import { errorHandler, ApiError, NetworkError, AuthenticationError } from '../utils/error-handler';
import { withRetry } from '../utils/retry';

export class BaseApiService {
  protected static readonly API_BASE_URL = APP_CONFIG.apiBaseUrl;

  protected static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    skipRetry: boolean = false
  ): Promise<ApiResponse<T>> {
    const operation = async (): Promise<ApiResponse<T>> => {
      const url = `${this.API_BASE_URL}${endpoint}`;
      const token = AuthService.getToken();
      
      logger.debug('API Request', { url, hasToken: !!token }, 'BaseApiService');
      
      if (!token) {
        throw new AuthenticationError('No authentication token found');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-App-Version': APP_CONFIG.version,
        ...options.headers,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        logger.debug('API Response', { 
          status: response.status, 
          ok: response.ok,
          url 
        }, 'BaseApiService');

        if (!response.ok) {
          if (response.status === 401) {
            throw new AuthenticationError('Authentication failed');
          }
          if (response.status >= 500) {
            throw new ApiError(`Server error: ${response.status}`, response.status);
          }
          throw new ApiError(`HTTP error: ${response.status}`, response.status);
        }

        const data = await response.json();
        
        logger.debug('API Response Data', { 
          status: data.status, 
          message: data.msg,
          hasData: !!data.data 
        }, 'BaseApiService');
        
        // Handle API-level errors
        if (!data.status) {
          if (data.msg?.toLowerCase().includes('unauthorized') || 
              data.msg?.toLowerCase().includes('token')) {
            logger.warn('Token expired or unauthorized, logging out...', undefined, 'BaseApiService');
            AuthService.logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            throw new AuthenticationError(data.msg || 'Authentication failed');
          }
          throw new ApiError(data.msg || 'API request failed', response.status);
        }

        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new NetworkError('Request timeout', 408, 'TIMEOUT_ERROR');
        }
        
        if (error instanceof ApiError || 
            error instanceof NetworkError || 
            error instanceof AuthenticationError) {
          throw error;
        }
        
        throw new NetworkError('Network request failed', 0, 'NETWORK_ERROR', undefined, error as Error);
      }
    };

    if (skipRetry) {
      return operation();
    }

    return withRetry(operation, {
      maxAttempts: 3,
      delay: 1000,
      shouldRetry: (error) => {
        // Don't retry auth errors or client errors
        if (error instanceof AuthenticationError || 
            (error.statusCode >= 400 && error.statusCode < 500)) {
          return false;
        }
        return errorHandler.isRetryableError(error);
      }
    }, 'BaseApiService');
  }

  protected static buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  protected static validatePagination(page: number, limit: number): { page: number; limit: number } {
    const validPage = Math.max(1, Math.floor(page));
    const validLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    
    return { page: validPage, limit: validLimit };
  }
}