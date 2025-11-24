import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export type User = SupabaseUser;

export type AuthSession = Session;

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends SignInCredentials {
  metadata?: {
    full_name?: string;
    name?: string;
    age?: number;
    [key: string]: unknown;
  };
}

export interface AuthError {
  message: string;
  status?: number;
}
