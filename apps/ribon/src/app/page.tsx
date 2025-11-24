"use client";

import { useUser, useAuth } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";

export default function Home() {
  const { user, isLoading } = useUser();
  const { signOut } = useAuth();
  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Button appName="Ribon">Click me</Button>
      <br />

      {user ? (
        <div className="space-y-4 text-center">
          <p className="text-lg">Welcome {user.email}</p>
          <button
            onClick={() => signOut()}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            ログアウト
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p>ログインまたは登録してください</p>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              ログイン
            </Link>
            <Link
              href="/register"
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              新規登録
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
