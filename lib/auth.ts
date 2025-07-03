import { APP_CONFIG, API_ENDPOINTS } from './config/constants';
import { logger } from './utils/logger';
import { errorHandler, AuthenticationError, ApiError } from './utils/error-handler';
import { validators, sanitizers } from './utils/validation';

interface LoginCredentials {
  mobile: string;
  password: string;
}

interface AdminUser {
  _id: string;
  name: string;
  mobile: string;
  email: string;
  profile_pic: string;
  access_token: string;
  city_id: number;
  admin_role: number;
  createdAt: string;
  updatedAt: string;
}

interface LoginResponse {
  status: boolean;
  msg: string;
  data: {
    user: AdminUser;
  };
}

interface ProfileResponse {
  status: boolean;
  msg: string;
  data: {
    profile: AdminUser;
  };
}

export class AuthService {
  private static readonly API_BASE_URL = APP_CONFIG.apiBaseUrl;
  private static readonly TOKEN_KEY = 'spinovo_admin_token';
  private static readonly USER_KEY = 'spinovo_admin_user';
  private static readonly TOKEN_EXPIRY_KEY = 'spinovo_token_expiry';

  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Validate credentials
      const sanitizedMobile = sanitizers.mobile(credentials.mobile);
      
      if (!validators.mobile(sanitizedMobile)) {
        throw new AuthenticationError('Invalid mobile number format');
      }
      
      if (!validators.password(credentials.password)) {
        throw new AuthenticationError('Invalid password format');
      }

      logger.info('Attempting login', { mobile: sanitizedMobile }, 'AuthService');

      const response = await fetch(`${this.API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Version': APP_CONFIG.version,
        },
        body: JSON.stringify({
          mobile: sanitizedMobile,
          password: credentials.password,
        }),
      });
console.log(response);
      if (!response.ok) {
        throw new ApiError(`Login failed: ${response.status}`, response.status);
      }

      const data = await response.json();
      
      if (data.status && data.data?.user?.access_token) {
        this.setToken(data.data.user.access_token);
        this.setUser(data.data.user);
        this.setTokenExpiry();
        
        logger.info('Login successful', { userId: data.data.user._id }, 'AuthService');
      } else {
        logger.warn('Login failed', { message: data.msg }, 'AuthService');
      }

      return data;
    } catch (error) {
      const handledError = errorHandler.handle(error as Error, 'AuthService.login');
      logger.error('Login error', { error: handledError.message }, 'AuthService');
      throw handledError;
    }
  }

  static async getProfile(): Promise<ProfileResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new AuthenticationError('No access token found');
      }

      logger.debug('Fetching profile', undefined, 'AuthService');

      const response = await fetch(`${this.API_BASE_URL}${API_ENDPOINTS.PROFILE}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-App-Version': APP_CONFIG.version,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new AuthenticationError('Token expired');
        }
        throw new ApiError(`Profile fetch failed: ${response.status}`, response.status);
      }

      const data = await response.json();
      
      if (data.status && data.data?.profile) {
        this.setUser(data.data.profile);
        logger.debug('Profile updated', { userId: data.data.profile._id }, 'AuthService');
      }

      return data;
    } catch (error) {
      const handledError = errorHandler.handle(error as Error, 'AuthService.getProfile');
      logger.error('Profile fetch error', { error: handledError.message }, 'AuthService');
      throw handledError;
    }
  }

  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.TOKEN_KEY, token);
        logger.debug('Token stored', undefined, 'AuthService');
      } catch (error) {
        logger.error('Failed to store token', { error }, 'AuthService');
      }
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem(this.TOKEN_KEY);
        
        // Check if token is expired
        if (token && this.isTokenExpired()) {
          logger.warn('Token expired, clearing storage', undefined, 'AuthService');
          this.logout();
          return null;
        }
        
        return token;
      } catch (error) {
        logger.error('Failed to retrieve token', { error }, 'AuthService');
        return null;
      }
    }
    return null;
  }

  static setUser(user: AdminUser): void {
    if (typeof window !== 'undefined') {
      try {
        // Sanitize user data before storing
        const sanitizedUser = {
          ...user,
          name: sanitizers.name(user.name),
          mobile: sanitizers.mobile(user.mobile),
        };
        
        localStorage.setItem(this.USER_KEY, JSON.stringify(sanitizedUser));
        logger.debug('User data stored', { userId: user._id }, 'AuthService');
      } catch (error) {
        logger.error('Failed to store user data', { error }, 'AuthService');
      }
    }
  }

  static getUser(): AdminUser | null {
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
      } catch (error) {
        logger.error('Failed to retrieve user data', { error }, 'AuthService');
        return null;
      }
    }
    return null;
  }

  static setTokenExpiry(): void {
    if (typeof window !== 'undefined') {
      try {
        // Set token expiry to 24 hours from now
        const expiry = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiry.toString());
      } catch (error) {
        logger.error('Failed to set token expiry', { error }, 'AuthService');
      }
    }
  }

  static isTokenExpired(): boolean {
    if (typeof window !== 'undefined') {
      try {
        const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        if (!expiry) return true;
        
        return Date.now() > parseInt(expiry);
      } catch (error) {
        logger.error('Failed to check token expiry', { error }, 'AuthService');
        return true;
      }
    }
    return true;
  }

  static logout(): void {
    if (typeof window !== 'undefined') {
      try {
        const user = this.getUser();
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
        
        logger.info('User logged out', { userId: user?._id }, 'AuthService');
      } catch (error) {
        logger.error('Failed to clear storage during logout', { error }, 'AuthService');
      }
    }
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    const isValid = !!(token && user && !this.isTokenExpired());
    
    logger.debug('Authentication check', { 
      hasToken: !!token, 
      hasUser: !!user, 
      isExpired: this.isTokenExpired(),
      isValid 
    }, 'AuthService');
    
    return isValid;
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { 
      Authorization: `Bearer ${token}`,
      'X-App-Version': APP_CONFIG.version,
    } : {};
  }

  static async validateToken(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        return false;
      }
      
      const response = await this.getProfile();
      return response.status;
    } catch (error) {
      logger.error('Token validation failed', { error }, 'AuthService');
      this.logout();
      return false;
    }
  }
}