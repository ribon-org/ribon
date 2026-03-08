import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { updateUserName } from "../../../../../actions/updateUserName";

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
      console.log(result.error);
      return c.json({ error: "Invalid JSON" }, 400);
    }
  }),
  zValidator("param", paramsSchema, (result, c) => {
    if (!result.success) {
      console.log(result.error);
      return c.json({ error: "Invalid parameter" }, 400);
    }
  }),
  async (c) => {
    const { userId } = c.req.valid("param");
    const { name } = c.req.valid("json");

    const result = await updateUserName({
      userId,
      name,
    });

    return c.json({ id: result.id }, 200);
  },
);

export default app;
