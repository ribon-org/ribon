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
```typescript
// apps/ribon/src/hooks/useCompanies.ts
"use client";

import useSWR from "swr";

export function useCompanies() {
  return useSWR("/api/companies", async (url) => {
    const res = await fetch(url, { credentials: "include" });
    return res.json();
  });
}
```

```typescript
// apps/ribon/src/app/api/companies/route.ts
import { listCompanies } from "@repo/core/usecases/companies";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const companies = await listCompanies();
    return NextResponse.json(companies);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
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
│  │  │ /api/companies  │                  │                     │  │
│  │  │ /api/projects   │                  │                     │  │
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
const response = await fetch("/api/companies", {
  credentials: "include"
});
```

#### ビジネスロジック（BFF層）
```typescript
// ✅ @repo/coreのドメインロジックを使用
import { listCompanies } from "@repo/core/usecases/companies";

export async function GET() {
  const companies = await listCompanies();
  return NextResponse.json(companies);
}
```

### DON'T: 避けるべきこと

#### フロントエンドから直接ドメインロジックを呼び出す
```typescript
// ❌ UI ComponentやHooksから@repo/coreを直接呼び出し
import { listCompanies } from "@repo/core/usecases/companies";
const companies = await listCompanies();
```

#### クライアント側での直接的なSupabase呼び出し
```typescript
// ❌ クライアント側でSupabaseを直接使用
import { supabase } from "@repo/auth/client/supabase";
await supabase.auth.signOut();
```

## まとめ

- **データフロー**: ribon UI → ribon API Routes (BFF) → @repo/core (ドメインロジック) → データベース/外部サービス
- **認証**: ribon UI → @repo/auth (Server Actions) → Supabase Auth
- **責務分離**:
  - **ribon**: BFFとフロントエンドを担当
  - **@repo/core**: ドメインロジックのみを担当
  - **@repo/auth**: 認証機能のみを担当

この設計により、将来的にモバイルアプリやデスクトップアプリを追加する際も、専用のBFFを作成し、`@repo/core`の同じドメインロジックを再利用することで一貫したビジネスロジックを提供できます。
