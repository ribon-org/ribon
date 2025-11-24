"use client";

import { useState } from "react";
import { supabase } from "../../supabase";
import { SignUpCredentials } from "../../../types";

export function useSignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = async ({
    email,
    password,
    metadata,
  }: SignUpCredentials)=> {
    setIsLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    setIsLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return { user: null, session: null, error: signUpError };
    }

    return { user: data.user, session: data.session, error: null };
  };

  return {
    signUp,
    isLoading,
    error,
  };
}
