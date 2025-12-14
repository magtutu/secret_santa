# UI Components

Reusable UI components built with Tailwind CSS for the Secret Santa Exchange application.

## Components

### Button

A flexible button component with multiple variants and sizes.

```tsx
import { Button } from '@/components/ui';

// Primary button (default)
<Button onClick={handleClick}>Click me</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Danger button
<Button variant="danger">Delete</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Full width
<Button fullWidth>Full Width Button</Button>

// Disabled state
<Button disabled>Disabled</Button>
```

### Input

An input component with label, error handling, and required field indicators.

```tsx
import { Input } from '@/components/ui';

// Basic input with label
<Input label="Email" type="email" />

// Required field (shows red asterisk)
<Input label="Password" type="password" required />

// With error message
<Input label="Username" error="Username is already taken" />

// With helper text
<Input label="Budget" type="number" helperText="Optional suggested budget" />
```

### Textarea

A textarea component with the same features as Input.

```tsx
import { Textarea } from '@/components/ui';

// Basic textarea
<Textarea label="Description" rows={4} />

// Required field
<Textarea label="Message" required />

// With helper text
<Textarea label="Notes" helperText="Add any additional notes here" />
```

### Card

A card component for displaying content in a contained, elevated surface.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

// Basic card
<Card>
  <p>Card content</p>
</Card>

// Card with different padding
<Card padding="sm">Small padding</Card>
<Card padding="lg">Large padding</Card>

// Card with hover effect
<Card hover>
  <p>Hover over me</p>
</Card>

// Structured card with header, content, and footer
<Card>
  <CardHeader>
    <CardTitle>Exchange Name</CardTitle>
    <CardDescription>A description of the exchange</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

### Navigation

A responsive navigation bar with user authentication state.

```tsx
import { Navigation } from '@/components/ui';

// Navigation for authenticated user
<Navigation
  user={{
    name: "John Doe",
    email: "john@example.com"
  }}
/>

// Navigation for unauthenticated user
<Navigation user={null} />

// With custom logout handler
<Navigation
  user={user}
  onLogout={() => {
    // Custom logout logic
  }}
/>
```

## Features

- **Responsive Design**: All components use Tailwind's responsive utilities
- **Accessibility**: Components include proper ARIA attributes
- **Required Field Indicators**: Input and Textarea components show visual indicators for required fields
- **Consistent Styling**: All components follow the same design system
- **TypeScript Support**: Full TypeScript definitions for all components
- **Tailwind CSS**: Built entirely with Tailwind utility classes

## Testing

All components are tested with property-based tests to ensure:
- Required field indicators are properly displayed (Property 20)
- Tailwind CSS utility classes are used throughout (Property 21)

Run tests with:
```bash
npm test components/ui/
```
