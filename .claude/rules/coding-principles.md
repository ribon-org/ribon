# Coding Principles

Core coding rules to always follow.

## Simplicity First

- Choose readable code over complex code
- Avoid over-abstraction
- Prioritize "understandable" over "working"

## Single Responsibility

- One function does one thing only
- One class has one responsibility only
- Target 200-400 lines per file (max 800)

## Early Return

```typescript
// Bad: Deep nesting
function process(value: number | null): Result | null {
  if (value !== null) {
    if (value > 0) {
      return doSomething(value);
    }
  }
  return null;
}

// Good: Early return
function process(value: number | null): Result | null {
  if (value === null) return null;
  if (value <= 0) return null;
  return doSomething(value);
}
```

## Type Annotations Required

All functions must have type annotations:

```typescript
function callLlm(
  prompt: string,
  model: string = "gpt-4",
  maxTokens: number = 1000,
): Promise<string> {
  // ...
}
```

## Immutability

Create new objects instead of mutating existing ones:

```typescript
// Bad: Mutating existing object
data.newKey = value;

// Good: Creating new object
const newData = { ...data, newKey: value };
```

## Naming Conventions

- **Variables/Functions**: camelCase (English)
- **Types/Interfaces/Classes**: PascalCase (English)
- **Constants**: UPPER_SNAKE_CASE (English)
- **Meaningful names**: `userCount` over `x`

## No Magic Numbers

```typescript
// Bad
if (retryCount > 3) {
  // ...
}

// Good
const MAX_RETRIES = 3;
if (retryCount > MAX_RETRIES) {
  // ...
}
```
