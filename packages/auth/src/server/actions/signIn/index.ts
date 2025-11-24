"use server";

import { createClient } from "../../supabase";
import { revalidatePath } from "next/cache";
import type { SignInCredentials } from "../../../types";

export async function signInAction(credentials: SignInCredentials) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
