import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export type User = SupabaseUser;

export type AuthSession = Session;

export type AuthState = {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
};

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = SignInCredentials & {
  metadata?: {
    full_name?: string;
    name?: string;
    age?: number;
    [key: string]: unknown;
  };
};

export type AuthError = {
  message: string;
  status?: number;
};
