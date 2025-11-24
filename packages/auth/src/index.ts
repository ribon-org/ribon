// クライアント
export { createClient, supabase } from "./client";

// サーバー
export { createClient as createServerClient } from "./server";

// Hooks
export { useUser } from "./hooks/useUser";
export { useAuth } from "./hooks/useAuth";

// ユーティリティ
export { getUser, requireAuth, getSession } from "./utils";

// 型
export type {
  User,
  AuthSession,
  AuthState,
  SignInCredentials,
  SignUpCredentials,
  AuthError,
} from "./types";

export type { Database } from "./types/database";
