import { VALIDATION_RULES } from '@/lib/config/constants';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validators = {
  mobile: (value: string): boolean => {
    if (!value) return false;
    if (value.length < VALIDATION_RULES.mobile.minLength) return false;
    if (value.length > VALIDATION_RULES.mobile.maxLength) return false;
    return VALIDATION_RULES.mobile.pattern.test(value);
  },

  password: (value: string): boolean => {
    if (!value) return false;
    if (value.length < VALIDATION_RULES.password.minLength) return false;
    if (value.length > VALIDATION_RULES.password.maxLength) return false;
    return true; // Remove regex pattern validation for login compatibility
  },

  name: (value: string): boolean => {
    if (!value) return false;
    if (value.length < VALIDATION_RULES.name.minLength) return false;
    if (value.length > VALIDATION_RULES.name.maxLength) return false;
    return VALIDATION_RULES.name.pattern.test(value);
  },

  email: (value: string): boolean => {
    if (!value) return true; // Email is optional in most cases
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value);
  },

  required: (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
  },
};

export const sanitizers = {
  string: (value: string): string => {
    return value?.trim() || '';
  },

  mobile: (value: string): string => {
    return value?.replace(/\D/g, '') || '';
  },

  name: (value: string): string => {
    return value?.trim().replace(/\s+/g, ' ') || '';
  },
};