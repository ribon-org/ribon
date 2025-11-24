import { Button } from "@repo/ui/components/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Button appName="Ribon">Click me</Button>
      <Link href="/register">Register</Link>
    </div>
  );
}
