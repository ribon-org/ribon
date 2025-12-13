import { Hono } from "hono";

const CORE_API_URL = process.env.CORE_API_URL;

const app = new Hono().get("/:userId", async (c) => {
  const userId = c.req.param("userId");

  const response = await fetch(`${CORE_API_URL}/api/users/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    return c.json(data, 400);
  }

  return c.json(data, 200);
});

export default app;
