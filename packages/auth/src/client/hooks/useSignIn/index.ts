"use client";

import { useState } from "react";
import { supabase } from "../../supabase";
import { SignInCredentials } from "../../../types";

export function useSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async ({
    email,
    password,
  }: SignInCredentials) => {
    setIsLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      }
    );

    setIsLoading(false);

    if (signInError) {
      setError(signInError.message);
      return { user: null, session: null, error: signInError };
    }

    return { user: data.user, session: data.session, error: null };
  };

  return {
    signIn,
    isLoading,
    error,
  };
}
