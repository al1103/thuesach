# Component Usage Guide

## Overview

This project uses a structured component architecture with three main categories:

- **Common**: Reusable UI primitives
- **Layout**: Structural page components
- **Features**: Domain-specific features

## Common Components

### Button

```vue
<script setup lang="ts">
import { Button } from '@/components/common'
</script>

<template>
  <!-- Default primary button -->
  <Button>Click me</Button>

  <!-- Different variants -->
  <Button variant="secondary">Secondary</Button>
  <Button variant="danger">Delete</Button>
  <Button variant="success">Save</Button>

  <!-- Different sizes -->
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>

  <!-- Other states -->
  <Button disabled>Disabled</Button>
  <Button loading>Loading...</Button>
  <Button full-width>Full Width</Button>

  <!-- With type -->
  <Button type="submit">Submit Form</Button>
</template>
```

**Props:**

- `variant`: 'primary' | 'secondary' | 'danger' | 'success' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `disabled`: boolean (default: false)
- `loading`: boolean (default: false)
- `fullWidth`: boolean (default: false)
- `type`: 'button' | 'submit' | 'reset' (default: 'button')

### Card

```vue
<script setup lang="ts">
import { Card } from '@/components/common'
</script>

<template>
  <!-- Default card -->
  <Card>
    <h2>Card Title</h2>
    <p>Card content goes here</p>
  </Card>

  <!-- With customization -->
  <Card padding="lg" shadow="lg" border>
    <h2>Featured Content</h2>
  </Card>

  <!-- With border color -->
  <Card border border-color="primary">
    <p>Primary bordered card</p>
  </Card>

  <!-- Custom background -->
  <Card background="#f0f9ff">
    <p>Custom background</p>
  </Card>
</template>
```

**Props:**

- `padding`: 'sm' | 'md' | 'lg' (default: 'md')
- `shadow`: 'none' | 'sm' | 'md' | 'lg' (default: 'md')
- `border`: boolean (default: false)
- `borderColor`: 'gray' | 'primary' | 'danger' (default: 'gray')
- `background`: string (default: 'white')

### Alert

```vue
<script setup lang="ts">
import { Alert } from '@/components/common'

const showAlert = ref(true)

const handleClose = (): void => {
  showAlert.value = false
}
</script>

<template>
  <Alert v-if="showAlert" type="success" title="Success!" dismissible @close="handleClose">
    Your action was completed successfully.
  </Alert>

  <Alert type="error" title="Error occurred"> Something went wrong. Please try again. </Alert>

  <Alert type="warning" title="Warning"> Please review your changes before proceeding. </Alert>

  <Alert type="info"> This is an informational message. </Alert>
</template>
```

**Props:**

- `type`: 'success' | 'error' | 'warning' | 'info' (default: 'info')
- `title`: string (optional)
- `dismissible`: boolean (default: true)

**Emits:**

- `close`: When alert is dismissed

## Layout Components

### Header

```vue
<script setup lang="ts">
import { Header } from '@/components/layout'
</script>

<template>
  <Header />
  <!-- Navigation and branding automatically handled -->
</template>
```

### Container

```vue
<script setup lang="ts">
import { Container } from '@/components/layout'
</script>

<template>
  <!-- Default container with lg max-width -->
  <Container>
    <div>Content</div>
  </Container>

  <!-- Different sizes -->
  <Container max-width="sm">Small container</Container>
  <Container max-width="xl">Extra large container</Container>

  <!-- Custom padding -->
  <Container padding="lg"> Large padding content </Container>
</template>
```

**Props:**

- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'lg')
- `padding`: 'sm' | 'md' | 'lg' (default: 'md')

## Feature Components

### Greetings

```vue
<script setup lang="ts">
import { Greetings } from '@/components/features'
</script>

<template>
  <Greetings msg="Welcome to Vue 3 + Vite" />
</template>
```

**Props:**

- `msg`: string - The greeting message

### FeatureItem

```vue
<script setup lang="ts">
import { FeatureItem } from '@/components/features'
</script>

<template>
  <FeatureItem
    icon="⚡"
    title="Lightning Fast"
    description="Vite provides incredible fast HMR in development"
  />
</template>
```

**Props:**

- `title`: string - Feature title
- `description`: string - Feature description
- `icon`: string (default: '✨') - Display icon/emoji

## Complete Example

```vue
<script setup lang="ts">
import { Container, Header } from '@/components/layout'
import { Button, Card, Alert } from '@/components/common'
import { Greetings, FeatureItem } from '@/components/features'
import { ref } from 'vue'

const features = [
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'Vite provides incredible fast HMR',
  },
  {
    icon: '🎯',
    title: 'Type Safe',
    description: 'TypeScript with full type support',
  },
]

const showAlert = ref(false)

const handleAction = (): void => {
  showAlert.value = true
}
</script>

<template>
  <Header />
  <Container max-width="lg" padding="lg">
    <Alert
      v-if="showAlert"
      type="success"
      title="Action completed!"
      dismissible
      @close="() => (showAlert = false)"
    >
      Your action was successful.
    </Alert>

    <Greetings msg="Welcome" />

    <div class="feature-grid">
      <Card v-for="feature in features" :key="feature.title" padding="md">
        <FeatureItem
          :icon="feature.icon"
          :title="feature.title"
          :description="feature.description"
        />
      </Card>
    </div>

    <div class="button-group">
      <Button @click="handleAction"> Perform Action </Button>
      <Button variant="secondary"> Cancel </Button>
    </div>
  </Container>
</template>

<style scoped>
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 2rem;
}
</style>
```

## Composition Guidelines

1. **Start with Layout**: Use `Header` and `Container` for page structure
2. **Add Content**: Use `Card` for content areas
3. **Enhance with Features**: Use feature components for specific functionality
4. **Polish with Common**: Use `Button` and `Alert` for interactions

## Best Practices

- ✅ Import components from index files when possible
- ✅ Use TypeScript types for all props
- ✅ Keep components focused and single-responsibility
- ✅ Prefer composition over component nesting depth
- ❌ Avoid direct HTML element styling in component CSS
- ❌ Don't hardcode values - use props instead
