# Security Rules

Security checklist to always verify when writing code.

## Secrets Management

### Never Do

- Hardcode API keys or passwords
- Log sensitive information
- Commit `.env` files

### Required

```typescript
// Good: Get from environment variables
const API_KEY = process.env.API_KEY;

// Good: With existence check
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable is required");
}
```

## Input Validation

Always validate external input using Zod:

```typescript
import { z } from "zod";

const userInputSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  name: z.string().min(1).max(100),
});

type UserInput = z.infer<typeof userInputSchema>;

// Usage: parse throws on invalid input
const validated = userInputSchema.parse(rawInput);
```

## SQL Injection Prevention

Always use Drizzle ORM query builders instead of raw SQL:

```typescript
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schemas/usersTable";

// Bad: Raw SQL with string interpolation
const result = await db.execute(`SELECT * FROM users WHERE id = ${userId}`);

// Good: Drizzle ORM query builder (parameterized automatically)
const result = await db.query.users.findFirst({
  where: eq(users.id, userId),
});

// Good: Drizzle ORM select with where clause
const result = await db.select().from(users).where(eq(users.id, userId));
```

## XSS Prevention

- Escape user input before embedding in HTML
- Use React's built-in JSX escaping (avoid `dangerouslySetInnerHTML`)
- Sanitize any user-generated content rendered as HTML

## Error Messages

```typescript
// Bad: Too detailed (gives attackers information)
throw new Error(`Database connection failed: ${connectionString}`);

// Good: Minimal information
throw new Error("Database connection failed");
// Details go to logs (logs are private)
console.error(`Database connection failed: ${connectionString}`);
```

## Dependencies

- Regular vulnerability checks: `bun audit` (or `npm audit`)
- Remove unused dependencies
- Use exact versions in `package.json` (e.g., `"1.2.3"` instead of `"^1.2.3"`)

## Code Review Checklist

- [ ] No hardcoded secrets
- [ ] External input is validated (Zod)
- [ ] Database queries use Drizzle ORM (no raw SQL interpolation)
- [ ] Error messages are not too detailed
- [ ] Logs don't contain sensitive information
