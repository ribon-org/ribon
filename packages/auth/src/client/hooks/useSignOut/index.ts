"use client";

import { useState } from "react";
import { supabase } from "../../supabase";

export function useSignOut() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    signOut,
    isLoading,
    error,
  };
}
