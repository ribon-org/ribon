import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("SUPABASE_URL or SUPABASE_KEY is not set");
}

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

export const supabase = createClient();
