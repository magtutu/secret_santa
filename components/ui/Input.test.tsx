import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { Input, Textarea } from './Input';

describe('Input Component', () => {
  // Feature: secret-santa-exchange, Property 20: Required field indicators
  // Validates: Requirements 8.4
  it('should indicate required fields with visual indicator', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          placeholder: fc.string({ maxLength: 50 }),
          type: fc.constantFrom('text', 'email', 'password', 'number', 'date'),
        }),
        (props) => {
          // Test with required=true
          const { container: requiredContainer } = render(
            <Input
              label={props.label}
              placeholder={props.placeholder}
              type={props.type}
              required={true}
            />
          );
          
          // Check that the rendered markup contains a required indicator
          const html = requiredContainer.innerHTML;
          
          // Should have the red asterisk indicator
          expect(html).toContain('text-red-500');
          expect(html).toContain('*');
          
          // Should have aria-required attribute
          const input = requiredContainer.querySelector('input');
          expect(input).toBeTruthy();
          expect(input?.getAttribute('aria-required')).toBe('true');
          expect(input?.hasAttribute('required')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not show required indicator when field is optional', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          placeholder: fc.string({ maxLength: 50 }),
        }),
        (props) => {
          // Test with required=false or undefined
          const { container } = render(
            <Input
              label={props.label}
              placeholder={props.placeholder}
              required={false}
            />
          );
          
          const input = container.querySelector('input');
          expect(input).toBeTruthy();
          expect(input?.hasAttribute('required')).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Textarea Component', () => {
  // Feature: secret-santa-exchange, Property 20: Required field indicators
  // Validates: Requirements 8.4
  it('should indicate required fields with visual indicator', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          placeholder: fc.string({ maxLength: 50 }),
          rows: fc.integer({ min: 1, max: 10 }),
        }),
        (props) => {
          // Test with required=true
          const { container: requiredContainer } = render(
            <Textarea
              label={props.label}
              placeholder={props.placeholder}
              rows={props.rows}
              required={true}
            />
          );
          
          // Check that the rendered markup contains a required indicator
          const html = requiredContainer.innerHTML;
          
          // Should have the red asterisk indicator
          expect(html).toContain('text-red-500');
          expect(html).toContain('*');
          
          // Should have aria-required attribute
          const textarea = requiredContainer.querySelector('textarea');
          expect(textarea).toBeTruthy();
          expect(textarea?.getAttribute('aria-required')).toBe('true');
          expect(textarea?.hasAttribute('required')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
