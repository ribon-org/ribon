import { getUser } from "@repo/auth/server";

export default async function DashboardPage() {
  const user = await getUser();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-2xl font-bold">ようこそ！</h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          認証ユーザー専用のダッシュボードページです。
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-lg font-semibold">ユーザー情報</h3>
        <dl className="mt-4 space-y-2">
          <div className="flex gap-4">
            <dt className="w-24 font-medium text-zinc-600 dark:text-zinc-400">
              User ID:
            </dt>
            <dd className="flex-1 font-mono text-sm">{user?.id}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-24 font-medium text-zinc-600 dark:text-zinc-400">
              Email:
            </dt>
            <dd className="flex-1">{user?.email}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-24 font-medium text-zinc-600 dark:text-zinc-400">
              作成日:
            </dt>
            <dd className="flex-1">
              {user?.created_at
                ? new Date(user.created_at).toLocaleString("ja-JP")
                : "-"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
