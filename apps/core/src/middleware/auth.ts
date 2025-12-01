import { createMiddleware } from "hono/factory";
import { createClient } from "@supabase/supabase-js";
import { env } from "../utils/config/env";

/**
 * 認証ミドルウェア
 * Authorization: Bearer {token}ヘッダーからJWTトークンを抽出し、Supabase Authで検証
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return c.json(
      {
        error:
          "Server configuration error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_KEY is not set",
      },
      500,
    );
  }

  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing or invalid token" }, 401);
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }

  c.set("user", user);
  await next();
});
