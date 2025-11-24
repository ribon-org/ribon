"use server";

import { createClient } from "../../supabase";
import type { SignUpCredentials } from "../../../types";

export async function signUpAction(data: SignUpCredentials) {
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: data.metadata,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: authData.user };
}
