"use client";

import { useState } from "react";
import { supabase } from "../../client";
import type { SignInCredentials, SignUpCredentials } from "../../types";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async ({ email, password }: SignInCredentials) => {
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

  const signUp = async ({ email, password, metadata }: SignUpCredentials) => {
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

  const signOut = async () => {
    setIsLoading(true);
    setError(null);

    const { error: signOutError } = await supabase.auth.signOut();

    setIsLoading(false);

    if (signOutError) {
      setError(signOutError.message);
      return { error: signOutError };
    }

    return { error: null };
  };

  return {
    signIn,
    signUp,
    signOut,
    isLoading,
    error,
  };
}
