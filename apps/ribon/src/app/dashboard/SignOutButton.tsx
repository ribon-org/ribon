"use client";

import { useSignOut } from "@repo/auth/client";

export function SignOutButton() {
  const { signOut, isPending, error } = useSignOut();

  return (
    <div>
      <button
        onClick={() => signOut()}
        disabled={isPending}
        className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
      >
        {isPending ? "ログアウト中..." : "ログアウト"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
