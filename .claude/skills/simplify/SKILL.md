---
name: simplify
description: Simplify and refactor code while preserving functionality and library constraints.
disable-model-invocation: true
---

# Simplify Code

Simplify and refactor $ARGUMENTS.

## Simplification Principles

1. **Single Responsibility** - 1 function = 1 thing
2. **Short Functions** - Target under 20 lines
3. **Shallow Nesting** - Early return, depth ≤ 2
4. **Clear Naming** - Clear enough to not need comments
5. **Type Annotations Required** - On all functions

## Steps

### 1. Analyze Target Code

- Read the file(s) to understand current structure
- Identify complexity hotspots (deep nesting, long functions)
- List functions/classes to simplify

### 2. Check Library Constraints

- Identify libraries used in target code
- Check constraints in `.claude/docs/libraries/`
- Web search for unclear library behaviors

### 3. Plan Refactoring

For each complexity issue:
- What change to make
- Why it improves readability
- Verify it doesn't break library usage

### 4. Execute Refactoring

Apply changes following these patterns:

**Early Return:**
```typescript
// Before
function process(value: number | null): Result | null {
  if (value !== null) {
    if (value > 0) {
      return doSomething(value);
    }
  }
  return null;
}

// After
function process(value: number | null): Result | null {
  if (value === null) return null;
  if (value <= 0) return null;
  return doSomething(value);
}
```

**Extract Function:**
```typescript
// Before
function main() {
  // 50 lines of mixed concerns
}

// After
function main() {
  const data = loadData();
  const result = processData(data);
  saveResult(result);
}
```

### 5. Verify with Tests

```bash
bunx vitest run
```

## Notes

- Always preserve library features/constraints
- Web search for unclear points
- Don't change behavior (refactoring only)
- Run tests after each significant change
