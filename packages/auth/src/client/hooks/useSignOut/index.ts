"use client";

import { signOutAction } from "@repo/auth/server/actions";
import { useTransition, useState } from "react";

export function useSignOut() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const signOut = async () => {
    setError(null);
    startTransition(async () => {
      try {
        await signOutAction();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "ログアウトに失敗しました",
        );
      }
    });
  };

  return {
    signOut,
    isPending,
    error,
  };
}
