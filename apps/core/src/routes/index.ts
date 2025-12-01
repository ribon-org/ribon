import { Hono } from "hono";
import users from "./users";

const app = new Hono();

// ドメインルーターの統合
app.route("/users", users);

// グローバルエラーハンドリング
app.onError((err, c) => {
  console.error("Unhandled error:", err);

  if (err instanceof Error) {
    // Forbidden エラー
    if (err.message.includes("Forbidden")) {
      return c.json({ error: err.message }, 403);
    }

    // Not found エラー
    if (err.message.includes("Not found")) {
      return c.json({ error: err.message }, 404);
    }

    // Conflict エラー
    if (err.message.includes("Conflict")) {
      return c.json({ error: err.message }, 409);
    }

    // Validation エラー
    if (err.message.includes("validation")) {
      return c.json({ error: "Validation failed", details: err.message }, 400);
    }
  }

  return c.json({ error: "Internal server error" }, 500);
});

export default app;
