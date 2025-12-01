import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { createUserName } from "../services/users/create-user-name";
import { updateUserName } from "../services/users/update-user-name";
import type { User } from "@supabase/supabase-js";

type Variables = {
  user: User;
};

const users = new Hono<{ Variables: Variables }>();

const nameSchema = z.object({
  name: z.string().min(1).max(255),
});

/**
 * ユーザー名を新規登録
 * POST /api/users/:userId/name
 */
users.post(
  "/:userId/name",
  authMiddleware,
  zValidator("json", nameSchema),
  async (c) => {
    const { userId } = c.req.param();
    const { name } = c.req.valid("json");
    const authUser = c.get("user");

    try {
      const result = await createUserName({
        userId,
        name,
        authUserId: authUser.id,
      });

      return c.json(result, 201);
    } catch (err) {
      throw err;
    }
  },
);

/**
 * ユーザー名を更新
 * POST /api/users/:userId/name/update
 */
users.post(
  "/:userId/name/update",
  authMiddleware,
  zValidator("json", nameSchema),
  async (c) => {
    const { userId } = c.req.param();
    const { name } = c.req.valid("json");
    const authUser = c.get("user");

    try {
      const result = await updateUserName({
        userId,
        name,
        authUserId: authUser.id,
      });

      return c.json(result, 200);
    } catch (err) {
      throw err;
    }
  },
);

export default users;
