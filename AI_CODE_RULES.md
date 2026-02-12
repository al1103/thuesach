# AI Code Generation Rules

## Code Quality Standards

### Type Safety

- ✅ **REQUIRED**: All functions must have return type annotations
- ✅ **REQUIRED**: All function parameters must be typed
- ⚠️ **WARNING**: Avoid `any` type - use generics or unions instead
- ✅ **REQUIRED**: Use strict TypeScript mode

### Vue Component Standards

- ✅ **REQUIRED**: All components must have `name` property
- ✅ **REQUIRED**: All list rendering must use `key` binding
- ✅ **REQUIRED**: Props must be validated with type definitions
- ✅ **REQUIRED**: Emits should be explicitly defined
- ✅ **REQUIRED**: Use Composition API with `<script setup lang="ts">`
- ✅ **REQUIRED**: Export interface types for Props and Emits
- ✅ **REQUIRED**: Add JSDoc comment blocks for components
- ⚠️ **PREFERRED**: Keep components under 200 lines
- ⚠️ **PREFERRED**: Extract styles with proper scoping

### Security Rules

- ❌ **FORBIDDEN**: Use of `eval()`
- ❌ **FORBIDDEN**: Use of `innerHTML` without sanitization
- ❌ **FORBIDDEN**: Inline JavaScript in templates
- ⚠️ **WARNING**: Always validate user input
- ⚠️ **WARNING**: Always validate API responses

### Code Organization

- ✅ **REQUIRED**: Functions limited to 50 lines maximum
- ✅ **REQUIRED**: Components limited to 200 lines maximum
- ✅ **REQUIRED**: Max cyclomatic complexity: 10
- ✅ **REQUIRED**: Max nesting depth: 4
- ⚠️ **PREFERRED**: Keep functions single-responsibility
- ⚠️ **PREFERRED**: Extract constants and magic numbers

### Documentation

- ✅ **REQUIRED**: JSDoc comments for exported functions
- ✅ **REQUIRED**: Comments for complex logic
- ⚠️ **PREFERRED**: README for new modules
- ⚠️ **PREFERRED**: Example usage in comments

### Error Handling

- ✅ **REQUIRED**: Try-catch blocks for async operations
- ✅ **REQUIRED**: Error logging for production issues
- ✅ **REQUIRED**: User-friendly error messages
- ⚠️ **PREFERRED**: Specific error types instead of generic Error

### Testing

- ⚠️ **PREFERRED**: Unit tests for utilities
- ⚠️ **PREFERRED**: Component tests for Vue components
- ⚠️ **PREFERRED**: E2E tests for critical flows
- ⚠️ **GOAL**: Minimum 70% test coverage

### Performance

- ⚠️ **PREFERRED**: Memoize expensive computations
- ⚠️ **PREFERRED**: Lazy load components when possible
- ⚠️ **PREFERRED**: Use computed properties for reactive data
- ⚠️ **PREFERRED**: Avoid inline functions in templates

## Component Structure Guidelines

### Common Components (`src/components/common/`)

Reusable, unstyled UI primitives:

- `Button.vue` - Flexible button with variants (primary, secondary, danger, success)
- `Card.vue` - Container with configurable padding, shadow, and border
- `Alert.vue` - Dismissible alert with four types (success, error, warning, info)

**Rules:**

- ✅ **REQUIRED**: Must be purely presentational
- ✅ **REQUIRED**: No business logic
- ✅ **REQUIRED**: Accept all configuration via props
- ✅ **REQUIRED**: Emit events for user interactions
- ⚠️ **PREFERRED**: Support dark mode variants

### Layout Components (`src/components/layout/`)

Structural components for page layouts:

- `Header.vue` - Top navigation and branding
- `Container.vue` - Responsive max-width wrapper

**Rules:**

- ✅ **REQUIRED**: Handle responsive breakpoints                              
- ✅ **REQUIRED**: Provide consistent spacing
- ⚠️ **PREFERRED**: Use semantic HTML

### Feature Components (`src/components/features/`)

Domain-specific, feature-focused components:

- `Greetings.vue` - Welcome message display
- `FeatureItem.vue` - Individual feature showcase

**Rules:**

- ✅ **REQUIRED**: Can contain business logic
- ✅ **REQUIRED**: Compose common components
- ⚠️ **PREFERRED**: Handle their own state
- ⚠️ **PREFERRED**: Communicate via props and emits

## Import Patterns

```typescript
// From common components
import { Button, Card, Alert } from '@/components/common'

// From layout components
import { Header, Container } from '@/components/layout'

// From feature components
import { Greetings, FeatureItem } from '@/components/features'

// Direct imports if needed
import Button from '@/components/common/Button.vue'
```

## Legend

- ✅ **REQUIRED**: Must be followed
- ⚠️ **WARNING/PREFERRED**: Should be followed
- ❌ **FORBIDDEN**: Never use

## Running Code Quality Checks

```bash
# Lint and auto-fix
npm run lint

# Type check
npm run type-check

# Build with all checks
npm run build
```
