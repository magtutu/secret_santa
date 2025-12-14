/**
 * Validation utilities for form inputs
 * Can be used on both client and server
 */

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates email format using a standard regex pattern
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Standard email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password strength
 * Requirements: minimum 8 characters
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  return password.length >= 8;
}

/**
 * Checks if a required field is present and non-empty
 */
export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  return true;
}

/**
 * Validates signup form data
 */
export interface SignupData {
  email?: string;
  password?: string;
  name?: string;
}

export function validateSignupForm(data: SignupData): ValidationResult {
  const errors: string[] = [];
  
  // Check required fields
  if (!validateRequired(data.email)) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email!)) {
    errors.push('Email format is invalid');
  }
  
  if (!validateRequired(data.password)) {
    errors.push('Password is required');
  } else if (!validatePassword(data.password!)) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!validateRequired(data.name)) {
    errors.push('Name is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates login form data
 */
export interface LoginData {
  email?: string;
  password?: string;
}

export function validateLoginForm(data: LoginData): ValidationResult {
  const errors: string[] = [];
  
  // Check required fields
  if (!validateRequired(data.email)) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email!)) {
    errors.push('Email format is invalid');
  }
  
  if (!validateRequired(data.password)) {
    errors.push('Password is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates exchange creation form data
 */
export interface ExchangeData {
  name?: string;
  description?: string;
  gift_budget?: number;
  exchange_date?: string;
}

export function validateExchangeForm(data: ExchangeData): ValidationResult {
  const errors: string[] = [];
  
  // Check required fields
  if (!validateRequired(data.name)) {
    errors.push('Exchange name is required');
  }
  
  if (!validateRequired(data.exchange_date)) {
    errors.push('Exchange date is required');
  } else {
    // Validate date format
    const date = new Date(data.exchange_date!);
    if (isNaN(date.getTime())) {
      errors.push('Exchange date is invalid');
    }
  }
  
  // Optional fields validation
  if (data.gift_budget !== undefined && data.gift_budget !== null) {
    if (typeof data.gift_budget !== 'number' || data.gift_budget < 0) {
      errors.push('Gift budget must be a positive number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
