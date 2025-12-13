import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

const CORE_API_URL = process.env.CORE_API_URL;

export const paramsSchema = z.object({
  userId: z.uuid(),
});

const app = new Hono().get(
  "/:userId",
  zValidator("param", paramsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid parameter" }, 400);
    }
  }),
  async (c) => {
    const { userId } = c.req.valid("param");

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
  },
);

export default app;
