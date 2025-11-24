"use client";

import { useUser } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";

export default function Home() {
  const { user, isLoading } = useUser();
  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Button appName="Ribon">Click me</Button>
      <br />
      <Link href="/register">Register</Link>
      <br />

      {user ? (
        <div>Welcome {user.email}</div>
      ) : (
        <div>ログインまたは登録してください</div>
      )}
    </div>
  );
}
