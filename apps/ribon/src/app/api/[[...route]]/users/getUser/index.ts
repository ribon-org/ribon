import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { coreClient } from "../../../../../lib/core-client";

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

    const response = await coreClient.api.users[":userId"].$get({
      param: { userId },
    });

    const data = await response.json();

    if (!response.ok) {
      return c.json(data, 400);
    }

    return c.json(data, 200);
  },
);

export default app;
