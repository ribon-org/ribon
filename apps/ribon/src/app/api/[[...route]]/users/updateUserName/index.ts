import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

const CORE_API_URL = process.env.CORE_API_URL;

const requestSchema = z.object({
  name: z.string().min(1).max(255),
});

export const paramsSchema = z.object({
  userId: z.uuid(),
});

const app = new Hono().post(
  "/:userId/name/update",
  zValidator("json", requestSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid JSON" }, 400);
    }
  }),
  zValidator("param", paramsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid parameter" }, 400);
    }
  }),
  async (c) => {
    const { userId } = c.req.valid("param");
    const { name } = c.req.valid("json");

    const response = await fetch(
      `${CORE_API_URL}/api/users/${userId}/name/update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return c.json(data, 400);
    }

    return c.json(data, 200);
  },
);

export default app;
