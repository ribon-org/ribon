# BFFアーキテクチャパターン

## 概要

このプロジェクトは、Backend for Frontend（BFF）アーキテクチャパターンを採用しています。

## アーキテクチャの構成

### ribon (Next.js)
- **役割**: BFF（Backend for Frontend）とフロントエンド
- **責務**:
  - フロントエンド向けのAPI提供（API Routes）
  - UIレイヤーの実装（Pages/Components）
  - データの変換・加工
  - ユーザーインターフェースの表示とユーザー操作の受付

### @repo/core
- **役割**: ドメインロジック層
- **責務**:
  - ビジネスロジックの実装
  - データベースアクセス
  - ドメインモデルの定義
  - 外部サービスとの連携
- **制約**: 必ず守るべきビジネスルールやロジックのみを配置

### 将来の拡張性
モバイルアプリやデスクトップアプリを追加する場合は、それぞれ専用のBFFを作成し、`@repo/core`の同じドメインロジックを使用することで、一貫したビジネスロジックを提供します。

## 認証機能について

### 認証フックの使用
以下の認証関連機能は、Next.js App RouterのServer Actionsを使用して実装されています：

- `useSignIn` - ログイン
- `useSignUp` - 新規登録
- `useSignOut` - ログアウト
- `useUser` - ユーザー情報取得

### セキュリティ上の考慮事項

#### Server Actionの利点
- **サーバー側実行**: 認証処理がサーバー側で完結
- **クッキー管理**: HTTPOnly cookieでセッション管理
- **CSRF対策**: Next.jsが自動的に対策

#### クライアント側の制約
```typescript
// ❌ クライアント側での直接的なSupabase呼び出しは避ける
const { error } = await supabase.auth.signOut();

// ✅ Server Actionを使用
const { signOut } = useSignOut();
await signOut();
```

## 実装パターン

### パターン1: 認証機能

```
ribon (UI Component)
  ↓
useSignIn / useSignOut / useSignUp
  ↓
@repo/auth/server (Server Action)
  ↓
Supabase Auth
```

**実装例:**
```typescript
// apps/ribon/src/app/login/page.tsx
"use client";

import { useSignIn } from "@repo/auth/client";

export default function LoginPage() {
  const { signIn } = useSignIn();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn({ email, password });
  };

  // ...
}
```

### パターン2: ビジネスロジック

```
ribon (UI Component)
  ↓
fetch / useSWR / React Query
  ↓
ribon (API Routes - BFF)
  ↓
@repo/core (ドメインロジック)
  ↓
外部サービス / データベース
```

**実装例:**

> 注: 現在実装済みのビジネスロジックAPIは `/api/users` のみです。
> 以下はcoreClientを使用した実際のパターンに基づく例です。

```typescript
// apps/ribon/src/app/api/[[...route]]/users/getUser/index.ts
// BFF層: coreClientを使って@repo/coreのAPIを型安全に呼び出す
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { coreClient } from "../../../../../lib/coreClient";

const app = new Hono().get(
  "/:userId",
  zValidator("param", z.object({ userId: z.uuid() })),
  async (c) => {
    const { userId } = c.req.valid("param");
    const response = await coreClient.api.users[":userId"].$get({
      param: { userId },
    });
    const data = await response.json();
    if (!response.ok) {
      return c.json(data, 400);
    }
    return c.json(data, 200);
  }
);
```

## アーキテクチャ図

### 全体像

```
┌──────────────────────────────────────────────────────────────────┐
│ ribon (Next.js App Router)                                        │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ フロントエンド層                                              │  │
│  │                                                              │  │
│  │  ┌──────────────┐              ┌──────────────┐             │  │
│  │  │ UI Components│              │ Auth Hooks   │             │  │
│  │  └──────┬───────┘              └──────┬───────┘             │  │
│  │         │                             │                     │  │
│  │         │ fetch                       │ Server Action       │  │
│  └─────────┼─────────────────────────────┼─────────────────────┘  │
│            │                             │                        │
│  ┌─────────▼─────────────────────────────┼─────────────────────┐  │
│  │ BFF層（API Routes）                    │                     │  │
│  │                                       │                     │  │
│  │  ┌─────────────────┐                  │                     │  │
│  │  │ API Routes      │                  │                     │  │
│  │  │ /api/users      │                  │                     │  │
│  │  │                 │                  │                     │  │
│  │  └────────┬────────┘                  │                     │  │
│  │           │                           │                     │  │
│  └───────────┼───────────────────────────┼─────────────────────┘  │
│              │                           │                        │
└──────────────┼───────────────────────────┼────────────────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────┐       ┌─────────────────────┐
│ @repo/core          │       │ @repo/auth          │
│ (ドメインロジック)    │       │                     │
│                     │       │ ┌─────────────────┐ │
│ - ビジネスロジック    │       │ │ Server Actions  │ │
│ - データベースアクセス │       │ │ signIn          │ │
│ - ドメインモデル      │       │ │ signOut         │ │
│ - 外部サービス連携    │       │ │ signUp          │ │
│                     │       │ └────────┬────────┘ │
│                     │       │          │          │
└──────────┬──────────┘       └──────────┼──────────┘
           │                             │
           ▼                             ▼
┌─────────────────────┐       ┌─────────────────────┐
│ Database /          │       │ Supabase Auth       │
│ External Services   │       │                     │
└─────────────────────┘       └─────────────────────┘
```

### データフロー: ログアウト処理

```
┌──────────────────────────────────────────────────────┐
│ 1. ユーザーがログアウトボタンをクリック                  │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│ 2. useSignOut().signOut() が実行される                │
│    (packages/auth/src/client/hooks/useSignOut)       │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│ 3. signOutAction (Server Action) を呼び出し           │
│    (packages/auth/src/server/actions/signOut)        │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│ 4. Supabase Auth でログアウト処理                      │
│    - セッションクッキーの削除                          │
│    - サーバー側セッションのクリア                       │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│ 5. revalidatePath("/") でキャッシュ無効化              │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│ 6. redirect("/") でホームページにリダイレクト           │
└──────────────────────────────────────────────────────┘
```

## ガイドライン

### DO: 実装すべきこと

#### 認証機能
```typescript
// ✅ 認証フックを使用
import { useSignIn, useSignOut, useUser } from "@repo/auth/client";

const { signIn } = useSignIn();
const { signOut } = useSignOut();
const { user } = useUser();
```

#### ビジネスロジック（フロントエンド）
```typescript
// ✅ ribonのAPI Routes（BFF）を呼び出し
const response = await fetch("/api/users/${userId}", {
  credentials: "include"
});
```

#### ビジネスロジック（BFF層）
```typescript
// ✅ coreClientを使って@repo/coreのAPIを型安全に呼び出す
import { coreClient } from "../../../../../lib/coreClient";

const response = await coreClient.api.users[":userId"].$get({
  param: { userId },
});
const data = await response.json();
```

### DON'T: 避けるべきこと

#### フロントエンドから直接ドメインロジックを呼び出す
```typescript
// ❌ UI ComponentやHooksから@repo/coreを直接呼び出し
import { getUser } from "@repo/core/actions/getUser";
const user = await getUser({ userId });
```

#### クライアント側での直接的なSupabase呼び出し
```typescript
// ❌ クライアント側でSupabaseを直接使用
import { supabase } from "@repo/auth/client/supabase";
await supabase.auth.signOut();
```

## coreClientの使用

### 概要

ribonのBFF層からcoreのAPIを呼び出す際は、`coreClient`を使用してください。
これにより、型安全なRPCスタイルのAPI呼び出しが可能になります。

### coreClientの定義

**ファイル**: `apps/ribon/src/lib/coreClient.ts`

```typescript
import { hc } from "hono/client";
import type { AppType as CoreType } from "../../../core/src/app/api/[[...route]]/route";

const coreUrl = process.env.CORE_API_URL || "";
const coreApiKey = process.env.CORE_API_KEY || "";

export const coreClient = hc<CoreType>(coreUrl, {
  headers: {
    Authorization: `Bearer ${coreApiKey}`,
  },
});
```

### 使用例

#### GET リクエスト

```typescript
import { coreClient } from "../../../../../lib/coreClient";

const response = await coreClient.api.users[":userId"].$get({
  param: { userId },
});

const data = await response.json();
```

#### POST リクエスト

```typescript
import { coreClient } from "../../../../../lib/coreClient";

const response = await coreClient.api.users[":userId"].name.$post({
  param: { userId },
  json: { name },
});

const data = await response.json();
```

### BFF APIの実装パターン

#### ディレクトリ構造

```
apps/ribon/src/app/api/
└── [[...route]]/
    ├── route.ts          # メインルーター
    └── users/
        ├── index.ts      # ユーザールートの統合
        ├── getUser/
        │   └── index.ts  # GET /api/users/:userId
        ├── storeUserName/
        │   └── index.ts  # POST /api/users/:userId/name
        └── updateUserName/
            └── index.ts  # POST /api/users/:userId/name/update
```

#### 実装例

**apps/ribon/src/app/api/[[...route]]/users/getUser/index.ts**

```typescript
import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { coreClient } from "../../../../../lib/coreClient";

export const paramsSchema = z.object({
  userId: z.uuid(),
});

const app = new Hono().get(
  "/:userId",
  zValidator("param", paramsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid parameter" }, 400);
    }
  }),
  async (c) => {
    const { userId } = c.req.valid("param");

    const response = await coreClient.api.users[":userId"].$get({
      param: { userId },
    });

    const data = await response.json();

    if (!response.ok) {
      return c.json(data, 400);
    }

    return c.json(data, 200);
  }
);

export default app;
```

### 重要な注意事項

1. **バリデーション**: BFF層でもZodバリデーションを実装し、不正なリクエストを早期にブロックする
2. **エラーハンドリング**: coreからのエラーレスポンスをそのまま返却する
3. **型安全性**: coreClientを使用することで、coreのAPI型が自動的に推論される
4. **認証**: coreClientは自動的にAuthorizationヘッダーを付与する

## 命名規則

### フォルダ名・ファイル名

- **キャメルケース**を使用する（小文字始まりで、単語の区切りは大文字）

✅ **正しい**:
- `getUser`
- `storeUserName`
- `updateUserName`

❌ **間違い**:
- `getuser` (全て小文字)
- `GetUser` (パスカルケース)
- `get_user` (スネークケース)

## まとめ

- **データフロー**: ribon UI → ribon API Routes (BFF) → @repo/core (ドメインロジック) → データベース/外部サービス
- **認証**: ribon UI → @repo/auth (Server Actions) → Supabase Auth
- **責務分離**:
  - **ribon**: BFFとフロントエンドを担当
  - **@repo/core**: ドメインロジックのみを担当
  - **@repo/auth**: 認証機能のみを担当

この設計により、将来的にモバイルアプリやデスクトップアプリを追加する際も、専用のBFFを作成し、`@repo/core`の同じドメインロジックを再利用することで一貫したビジネスロジックを提供できます。
