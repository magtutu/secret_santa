import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateRequired,
  validateSignupForm,
  validateLoginForm,
  validateExchangeForm,
} from './validation';

describe('validateEmail', () => {
  it('should accept valid email formats', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@domain.co.uk')).toBe(true);
    expect(validateEmail('name+tag@example.org')).toBe(true);
  });

  it('should reject invalid email formats', () => {
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('missing@domain')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
    expect(validateEmail('noat.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(validateEmail('  user@example.com  ')).toBe(true); // trimmed
    expect(validateEmail(null as any)).toBe(false);
    expect(validateEmail(undefined as any)).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should accept passwords with 8 or more characters', () => {
    expect(validatePassword('12345678')).toBe(true);
    expect(validatePassword('password123')).toBe(true);
    expect(validatePassword('verylongpassword')).toBe(true);
  });

  it('should reject passwords with fewer than 8 characters', () => {
    expect(validatePassword('short')).toBe(false);
    expect(validatePassword('1234567')).toBe(false);
    expect(validatePassword('')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(validatePassword(null as any)).toBe(false);
    expect(validatePassword(undefined as any)).toBe(false);
  });
});

describe('validateRequired', () => {
  it('should accept non-empty values', () => {
    expect(validateRequired('text')).toBe(true);
    expect(validateRequired('  text  ')).toBe(true);
    expect(validateRequired(123)).toBe(true);
    expect(validateRequired(0)).toBe(true);
    expect(validateRequired(false)).toBe(true);
  });

  it('should reject empty or missing values', () => {
    expect(validateRequired('')).toBe(false);
    expect(validateRequired('   ')).toBe(false);
    expect(validateRequired(null)).toBe(false);
    expect(validateRequired(undefined)).toBe(false);
  });
});

describe('validateSignupForm', () => {
  it('should validate complete and valid signup data', () => {
    const result = validateSignupForm({
      email: 'user@example.com',
      password: 'password123',
      name: 'John Doe',
    });
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing email', () => {
    const result = validateSignupForm({
      password: 'password123',
      name: 'John Doe',
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  it('should reject invalid email format', () => {
    const result = validateSignupForm({
      email: 'notanemail',
      password: 'password123',
      name: 'John Doe',
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email format is invalid');
  });

  it('should reject missing password', () => {
    const result = validateSignupForm({
      email: 'user@example.com',
      name: 'John Doe',
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password is required');
  });

  it('should reject weak password', () => {
    const result = validateSignupForm({
      email: 'user@example.com',
      password: 'short',
      name: 'John Doe',
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('should reject missing name', () => {
    const result = validateSignupForm({
      email: 'user@example.com',
      password: 'password123',
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });

  it('should collect multiple validation errors', () => {
    const result = validateSignupForm({});
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
    expect(result.errors).toContain('Email is required');
    expect(result.errors).toContain('Password is required');
    expect(result.errors).toContain('Name is required');
  });
});

describe('validateLoginForm', () => {
  it('should validate complete and valid login data', () => {
    const result = validateLoginForm({
      email: 'user@example.com',
      password: 'password123',
    });
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing email', () => {
    const result = validateLoginForm({
      password: 'password123',
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  it('should reject invalid email format', () => {
    const result = validateLoginForm({
      email: 'notanemail',
      password: 'password123',
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email format is invalid');
  });

  it('should reject missing password', () => {
    const result = validateLoginForm({
      email: 'user@example.com',
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password is required');
  });

  it('should collect multiple validation errors', () => {
    const result = validateLoginForm({});
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
    expect(result.errors).toContain('Email is required');
    expect(result.errors).toContain('Password is required');
  });
});

describe('validateExchangeForm', () => {
  it('should validate complete and valid exchange data', () => {
    const result = validateExchangeForm({
      name: 'Family Secret Santa',
      description: 'Annual family gift exchange',
      gift_budget: 50,
      exchange_date: '2024-12-25',
    });
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate minimal required fields', () => {
    const result = validateExchangeForm({
      name: 'Secret Santa',
      exchange_date: '2024-12-25',
    });
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing name', () => {
    const result = validateExchangeForm({
      exchange_date: '2024-12-25',
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Exchange name is required');
  });

  it('should reject missing exchange date', () => {
    const result = validateExchangeForm({
      name: 'Secret Santa',
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Exchange date is required');
  });

  it('should reject invalid date format', () => {
    const result = validateExchangeForm({
      name: 'Secret Santa',
      exchange_date: 'not-a-date',
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Exchange date is invalid');
  });

  it('should reject negative gift budget', () => {
    const result = validateExchangeForm({
      name: 'Secret Santa',
      exchange_date: '2024-12-25',
      gift_budget: -10,
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Gift budget must be a positive number');
  });

  it('should collect multiple validation errors', () => {
    const result = validateExchangeForm({
      gift_budget: -5,
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
    expect(result.errors).toContain('Exchange name is required');
    expect(result.errors).toContain('Exchange date is required');
  });
});
