import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "../types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_KEY is not set"
  );
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Componentからはcookieをセットできない
        }
      },
    },
  });
}
