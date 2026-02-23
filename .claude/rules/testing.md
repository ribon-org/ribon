# Testing Rules

Guidelines for writing tests.

## Core Principles

- **TDD recommended**: Write tests first
- **Coverage target**: 80% or higher
- **Execution speed**: Unit tests should be fast (< 100ms per test)

## Test Structure

### AAA Pattern

```typescript
it("should create a user with valid data", () => {
  // Arrange
  const userData = { name: "Alice", email: "alice@example.com" };

  // Act
  const user = createUser(userData);

  // Assert
  expect(user.name).toBe("Alice");
  expect(user.email).toBe("alice@example.com");
});
```

### Naming Convention

```typescript
describe("createUser", () => {
  it("should return user when given valid data", () => {
    // ...
  });

  it("should throw error when given invalid email", () => {
    // ...
  });
});
```

## Test Case Coverage

For each feature, consider:

1. **Happy path**: Basic functionality
2. **Boundary values**: Min, max, empty
3. **Error cases**: Invalid input, error conditions
4. **Edge cases**: null, undefined, empty string, special characters

## Mocking

Mock external dependencies:

```typescript
import { vi } from "vitest";

vi.mock("@/lib/api", () => ({
  externalApiCall: vi.fn(),
}));

it("should handle API response", async () => {
  const mockApi = vi.mocked(externalApiCall);
  mockApi.mockResolvedValue({ status: "ok" });

  const result = await functionUnderTest();
  expect(result).toEqual(expected);
});
```

## Setup / Teardown

Common setup goes in `beforeEach` or factory functions:

```typescript
// Factory function pattern
function createSampleUser(overrides?: Partial<User>): User {
  return {
    name: "Test",
    email: "test@example.com",
    ...overrides,
  };
}

// Setup / teardown pattern
describe("database operations", () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.rollback();
  });
});
```

## Commands

```bash
# All tests
bun run test

# Specific file
bunx vitest run src/user.test.ts

# Specific test by name
bunx vitest run -t "should create user"

# With coverage
bunx vitest run --coverage

# Watch mode
bunx vitest

# Stop on first failure
bunx vitest run --bail 1
```

## Checklist

- [ ] Happy path is tested
- [ ] Error cases are tested
- [ ] Boundary values are tested
- [ ] Tests are independent (no order dependency)
- [ ] External dependencies are mocked
- [ ] Tests run fast
