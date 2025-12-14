import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { Navigation } from './Navigation';

describe('UI Components - Tailwind CSS Usage', () => {
  // Feature: secret-santa-exchange, Property 21: Tailwind CSS usage
  // Validates: Requirements 8.6
  it('Button component should use Tailwind CSS utility classes', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string({ minLength: 1, maxLength: 50 }),
          variant: fc.constantFrom('primary', 'secondary', 'danger'),
          size: fc.constantFrom('sm', 'md', 'lg'),
        }),
        (props) => {
          const { container } = render(
            <Button variant={props.variant} size={props.size}>
              {props.text}
            </Button>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeTruthy();
          
          const className = button?.className || '';
          
          // Should contain Tailwind utility classes
          // Check for common Tailwind patterns
          const hasTailwindClasses = 
            className.includes('rounded') ||
            className.includes('px-') ||
            className.includes('py-') ||
            className.includes('bg-') ||
            className.includes('text-') ||
            className.includes('hover:') ||
            className.includes('focus:');
          
          expect(hasTailwindClasses).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: secret-santa-exchange, Property 21: Tailwind CSS usage
  // Validates: Requirements 8.6
  it('Input component should use Tailwind CSS utility classes', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          placeholder: fc.string({ maxLength: 50 }),
        }),
        (props) => {
          const { container } = render(
            <Input label={props.label} placeholder={props.placeholder} />
          );
          
          const input = container.querySelector('input');
          expect(input).toBeTruthy();
          
          const className = input?.className || '';
          
          // Should contain Tailwind utility classes
          const hasTailwindClasses = 
            className.includes('rounded') ||
            className.includes('border') ||
            className.includes('px-') ||
            className.includes('py-') ||
            className.includes('text-') ||
            className.includes('focus:');
          
          expect(hasTailwindClasses).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: secret-santa-exchange, Property 21: Tailwind CSS usage
  // Validates: Requirements 8.6
  it('Card component should use Tailwind CSS utility classes', () => {
    fc.assert(
      fc.property(
        fc.record({
          content: fc.string({ minLength: 1, maxLength: 100 }),
          padding: fc.constantFrom('none', 'sm', 'md', 'lg'),
        }),
        (props) => {
          const { container } = render(
            <Card padding={props.padding}>
              <div>{props.content}</div>
            </Card>
          );
          
          const card = container.querySelector('div');
          expect(card).toBeTruthy();
          
          const className = card?.className || '';
          
          // Should contain Tailwind utility classes
          const hasTailwindClasses = 
            className.includes('rounded') ||
            className.includes('bg-') ||
            className.includes('shadow') ||
            className.includes('p-');
          
          expect(hasTailwindClasses).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: secret-santa-exchange, Property 21: Tailwind CSS usage
  // Validates: Requirements 8.6
  it('Navigation component should use Tailwind CSS utility classes', () => {
    fc.assert(
      fc.property(
        fc.record({
          userName: fc.string({ minLength: 1, maxLength: 50 }),
          userEmail: fc.emailAddress(),
        }),
        (props) => {
          const { container } = render(
            <Navigation
              user={{
                name: props.userName,
                email: props.userEmail,
              }}
            />
          );
          
          const nav = container.querySelector('nav');
          expect(nav).toBeTruthy();
          
          const className = nav?.className || '';
          
          // Should contain Tailwind utility classes
          const hasTailwindClasses = 
            className.includes('bg-') ||
            className.includes('shadow');
          
          expect(hasTailwindClasses).toBe(true);
          
          // Check that the entire component uses Tailwind classes
          const html = container.innerHTML;
          const tailwindPatterns = [
            'flex',
            'px-',
            'py-',
            'text-',
            'rounded',
            'hover:',
          ];
          
          const usesTailwind = tailwindPatterns.some(pattern => html.includes(pattern));
          expect(usesTailwind).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
