# Error Handling Rules

> Detailed version: `.claude/docs/architecture/error-handling-detail.md`

## Core Principle

**Do NOT place try-catch in route handlers.** Let errors propagate to the global error handler.

## Layer Responsibilities

### Route Layer (API Routes)

```typescript
// ✅ Recommended: No try-catch
async (c) => {
  const { userId } = c.req.valid("param");
  const result = await someAction({ userId });
  return c.json(result, 200);
}

// ❌ Avoid: try-catch in routes
async (c) => {
  try {
    const result = await someAction({ userId });
    return c.json(result, 200);
  } catch (error) {
    return c.json({ error: "..." }, 500);
  }
}
```

**Does**: Request handling, validation (zValidator), call action layer, return response
**Does NOT**: try-catch, error message formatting, error logging

### Action Layer (Business Logic)

```typescript
// ✅ Throw errors to propagate upward
export async function getUser({ userId }: { userId: string }) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}
```

**Does**: Business logic, database access, `throw new Error()` for error propagation

### Global Error Handler (Future)

```typescript
// Future implementation with app.onError()
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: err.message || "Internal Server Error" }, 500);
});
```

## Validation Errors

Validation errors are handled at the route layer via `zValidator` — this is acceptable and not subject to the "no try-catch" rule.

```typescript
zValidator("param", paramsSchema, (result, c) => {
  if (!result.success) {
    return c.json({ error: "Invalid parameter" }, 400);
  }
}),
```

## Summary

| Layer | Error Handling | try-catch |
|-------|---------------|-----------|
| Route | None (propagate) | Do NOT use |
| Action | throw new Error() | Do NOT use |
| Global Handler | app.onError() | Future implementation |

**Key Rules:**
1. No try-catch in routes
2. Let errors propagate naturally upward
3. Global error handler will centralize error management (future)
4. Validation errors handled at route layer via zValidator is OK
