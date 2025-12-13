import { Hono } from "hono";

const CORE_API_URL = process.env.CORE_API_URL;

const app = new Hono().post("/:userId/name", async (c) => {
  const userId = c.req.param("userId");
  const body = await c.req.json();

  const response = await fetch(`${CORE_API_URL}/api/users/${userId}/name`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    return c.json(data, 400);
  }

  return c.json(data, 201);
});

export default app;
