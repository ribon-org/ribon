# Core パッケージのアーキテクチャ

## 概要

`@repo/core` は、共通のビジネスロジックとデータアクセス層を提供するパッケージです。
Next.js の App Router と Hono を組み合わせた BFF（Backend for Frontend）として機能し、
`@repo/ribon` などのフロントエンドアプリケーションに API を提供します。

## アーキテクチャの全体像

```
┌─────────────────────────────────────────────────────────┐
│ Route Layer (Next.js App Router + Hono)                 │
│ - リクエストの受付とバリデーション                          │
│ - ドメインごとのルーター分割                               │
│ - Zod バリデーション（@hono/zod-validator）               │
│ - try-catch は使わない（エラーは上位に伝播）               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Action Layer (Business Logic)                           │
│ - ビジネスルールの実装                                     │
│ - 複数のデータソースの調整                                 │
│ - トランザクション制御（transactionDB）                    │
│ - エラー時は throw new Error()                           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Data Access Layer                                       │
│ - データベースクエリの実装（一ファイル一関数）               │
│ - Soft Delete 対応（deletedAt IS NULL）                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Database / External Services                            │
│ - PostgreSQL (via Drizzle ORM)                          │
│ - Supabase Auth                                         │
└─────────────────────────────────────────────────────────┘
```

## ディレクトリ構造（実際のプロジェクト）

```
apps/core/
├── db/
│   ├── client/
│   │   └── transaction/
│   │       └── index.ts              # トランザクション用 DB クライアント
│   ├── schemas/
│   │   ├── usersTable.ts             # ユーザーテーブル定義
│   │   └── userNamesTable.ts         # ユーザー名テーブル定義
│   └── migrations/
│       ├── 20251124073214_create_users.sql
│       ├── 20251124073215_create_function_handle_new_user.sql
│       ├── 20251124073216_create_trigger_on_auth_user_created.sql
│       ├── 20251130103911_create_user_names_table.sql
│       └── meta/
├── drizzle.config.ts                 # Drizzle Kit 設定
├── utils/
│   └── config/
│       └── env/
│           └── index.ts              # 環境変数（postgresUrl）
└── src/
    ├── app/
    │   └── api/
    │       └── [[...route]]/
    │           ├── route.ts           # Hono エントリーポイント
    │           └── users/
    │               ├── index.ts       # users ルーター統合
    │               ├── getUser/
    │               │   └── index.ts   # GET /:userId
    │               ├── storeUserName/
    │               │   └── index.ts   # POST /:userId/name
    │               └── updateUserName/
    │                   └── index.ts   # POST /:userId/name/update
    ├── actions/
    │   ├── getUser/
    │   │   └── index.ts               # ユーザー取得ロジック
    │   ├── storeUserName/
    │   │   └── index.ts               # ユーザー名登録ロジック
    │   └── updateUserName/
    │       └── index.ts               # ユーザー名更新ロジック
    └── data-access/
        └── db/
            └── users/
                ├── getUser/
                │   └── index.ts       # ユーザー + ユーザー名の JOIN 取得
                ├── getUserById/
                │   └── index.ts       # supabaseAuthId でユーザー取得
                ├── getUserNameByUserId/
                │   └── index.ts       # userId でユーザー名取得
                ├── storeUserName/
                │   └── index.ts       # ユーザー名の新規作成
                └── updateUserNameRecord/
                    └── index.ts       # ユーザー名の更新
```

## レイヤー設計

### 1. Route Layer

Next.js の App Router と Hono を組み合わせたルーティング層です。
ルート定義は `apps/core/src/app/api/[[...route]]/` 配下にドメインごとのサブディレクトリとして配置します。

#### 責務

- リクエストの受付
- Zod によるリクエストバリデーション（`@hono/zod-validator`）
- Action 層の呼び出し
- レスポンスの返却

#### やらないこと

- try-catch（エラーは上位に伝播させる）
- エラーメッセージのフォーマット
- ビジネスロジック

#### Hono エントリーポイント

```typescript
// apps/core/src/app/api/[[...route]]/route.ts
import { handle } from "hono/vercel";
import { Hono } from "hono";
import users from "./users";

export const app = new Hono().basePath("/api").route("/users", users);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
```

`AppType` をエクスポートすることで、フロントエンド側から Hono Client（`hc`）で型安全な API 呼び出しが可能になります。

#### ドメインルーターの統合

各ドメインは独立したルーターを持ち、`index.ts` で統合されます。

```typescript
// apps/core/src/app/api/[[...route]]/users/index.ts
import { Hono } from "hono";
import getUser from "./getUser";
import storeUserName from "./storeUserName";
import updateUserName from "./updateUserName";

const app = new Hono()
  .route("/", getUser)
  .route("/", storeUserName)
  .route("/", updateUserName);

export default app;
```

#### ルートハンドラの実装例

各エンドポイントは独立したディレクトリに配置し、一つの Hono アプリとして定義します。

**GET エンドポイント（パラメータバリデーション）:**

```typescript
// apps/core/src/app/api/[[...route]]/users/getUser/index.ts
import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getUser } from "../../../../../actions/getUser";

export const paramsSchema = z.object({
  userId: z.uuid(),
});

const app = new Hono().get(
  "/:userId",
  zValidator("param", paramsSchema, (result, c) => {
    if (!result.success) {
      console.log(result.error);
      return c.json({ error: "Invalid parameter" }, 400);
    }
  }),
  async (c) => {
    const { userId } = c.req.valid("param");

    const result = await getUser({ userId });
    return c.json(result, 200);
  },
);

export default app;
```

**POST エンドポイント（JSON + パラメータバリデーション）:**

```typescript
// apps/core/src/app/api/[[...route]]/users/storeUserName/index.ts
import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { storeUserName } from "../../../../../actions/storeUserName";

const requestSchema = z.object({
  name: z.string().min(1).max(255),
});

export const paramsSchema = z.object({
  userId: z.uuid(),
});

const app = new Hono().post(
  "/:userId/name",
  zValidator("json", requestSchema, (result, c) => {
    if (!result.success) {
      console.log(result.error);
      return c.json({ error: "Invalid JSON" }, 400);
    }
  }),
  zValidator("param", paramsSchema, (result, c) => {
    if (!result.success) {
      console.log(result.error);
      return c.json({ error: "Invalid parameter" }, 400);
    }
  }),
  async (c) => {
    const { userId } = c.req.valid("param");
    const { name } = c.req.valid("json");

    const result = await storeUserName({
      userId,
      name,
    });

    return c.json({ id: result.id }, 201);
  }
);

export default app;
```

#### グローバルエラーハンドリング [FUTURE]

> **注意**: グローバルエラーハンドラ（`app.onError()`）は未実装です。
> 現在はエラーが Action 層から throw され、Hono / Next.js のデフォルトエラーハンドリングに依存しています。

将来的に以下のような実装を予定しています:

```typescript
// [FUTURE] apps/core/src/app/api/[[...route]]/route.ts に追加予定
app.onError((err, c) => {
  console.error("Unhandled error:", err);

  if (err instanceof ZodError) {
    return c.json({ error: "Validation failed", details: err.errors }, 400);
  }

  return c.json({ error: "Internal server error" }, 500);
});
```

### 2. Action Layer (Business Logic)

ビジネスルールを実装する層です。
`apps/core/src/actions/` にドメインごとのディレクトリとして配置します。

#### 責務

- ビジネスロジックの実装
- 複数のデータソースの調整・集約
- トランザクションの制御（`transactionDB.transaction()`）
- ドメインルールの適用
- エラー時は `throw new Error()` で上位に伝播

#### ディレクトリ構造

```
apps/core/src/actions/
├── getUser/
│   └── index.ts              # ユーザー取得
├── storeUserName/
│   └── index.ts              # ユーザー名新規登録
└── updateUserName/
    └── index.ts              # ユーザー名更新
```

#### 実装例

**シンプルな取得（getUser）:**

```typescript
// apps/core/src/actions/getUser/index.ts
import { transactionDB } from "../../../db/client/transaction";
import { getUser as getUserFromDB } from "../../data-access/db/users/getUser";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

type GetUser = {
  userId: string;
};

export const getUser = async ({ userId }: GetUser) => {
  return await transactionDB.transaction(async (tx: PostgresJsDatabase) => {
    const user = await getUserFromDB(tx, userId);
    if (!user) {
      throw new Error("ユーザーが存在しません");
    }

    return {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });
};
```

**複数のデータアクセスを調整する例（storeUserName）:**

```typescript
// apps/core/src/actions/storeUserName/index.ts
import { transactionDB } from "../../../db/client/transaction";
import { getUserById } from "../../data-access/db/users/getUserById";
import { getUserNameByUserId } from "../../data-access/db/users/getUserNameByUserId";
import { storeUserName as storeUserNameFromDB } from "../../data-access/db/users/storeUserName";

type StoreUserName = {
  userId: string;
  name: string;
};

export const storeUserName = async ({ userId, name }: StoreUserName) => {
  return await transactionDB.transaction(async (tx) => {
    // 1. ユーザーの存在確認
    const user = await getUserById(tx, userId);
    if (!user) {
      throw new Error("ユーザーが存在しません");
    }

    // 2. 既存のユーザー名をチェック（重複防止）
    const existingUserName = await getUserNameByUserId(tx, user.id);
    if (existingUserName) {
      throw new Error("ユーザー名が既に存在します");
    }

    // 3. ユーザー名を保存
    const result = await storeUserNameFromDB(tx, {
      userId: user.id,
      name,
    });

    if (!result) {
      throw new Error("ユーザー名の登録に失敗しました");
    }

    return {
      id: result.id,
      userId: result.userId,
      name: result.name,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  });
};
```

#### Action 層の設計パターン

- **全ての Action は `transactionDB.transaction()` 内で実行**: 複数の DB 操作が含まれる場合のデータ整合性を保証
- **エラーは `throw new Error()` で伝播**: try-catch は使わない
- **返却値は必要なフィールドのみ**: DB の全カラムをそのまま返さず、必要なフィールドを明示的に選択
- **userId は supabaseAuthId**: 現在、Route 層から渡される `userId` は Supabase Auth の UUID

### 3. Data Access Layer

データベースとのやり取りを担当する層です。
`apps/core/src/data-access/db/` にドメインごとのディレクトリとして配置します。

#### 責務

- データベースクエリの実装
- Soft Delete の条件を含むクエリ
- データの永続化・取得

#### ディレクトリ構造 -- 一ファイル一関数の原則

各関数は独立したディレクトリに配置し、`index.ts` として実装します。

```
apps/core/src/data-access/
└── db/
    └── users/
        ├── getUser/
        │   └── index.ts              # JOIN を使ったユーザー + ユーザー名取得
        ├── getUserById/
        │   └── index.ts              # supabaseAuthId でユーザー取得
        ├── getUserNameByUserId/
        │   └── index.ts              # userId でユーザー名取得
        ├── storeUserName/
        │   └── index.ts              # ユーザー名の新規作成
        └── updateUserNameRecord/
            └── index.ts              # ユーザー名の更新
```

この構造のメリット:

- 関数の責務が明確になる
- ファイルの肥大化を防ぐ
- テストファイルを関数ごとに配置できる
- インポートパスが明確になる

#### DB 層の設計原則

**全てのクエリを `src/data-access/db/**` に集約する**

- Action 層や Route 層から直接 Drizzle のクエリを書かない
- データアクセスのロジックを一箇所に集約することで保守性を向上

**DB クライアントは第一引数で受け取る**

全ての data-access 関数は第一引数に `db`（`PostgresJsDatabase` 型）を受け取ります。
これにより、トランザクション内での実行が可能になります。

#### 実装例

**SELECT（単一テーブル、Soft Delete 対応）:**

```typescript
// apps/core/src/data-access/db/users/getUserById/index.ts
import { eq, and, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { usersTable } from "../../../../../db/schemas/usersTable";

export type DB = PostgresJsDatabase<Record<string, never>>;

export async function getUserById(db: DB, supabaseAuthId: string) {
  const result = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.supabaseAuthId, supabaseAuthId),
        isNull(usersTable.deletedAt),
      ),
    )
    .limit(1);

  return result[0] || null;
}
```

**SELECT（JOIN、複数テーブル、Soft Delete 対応）:**

```typescript
// apps/core/src/data-access/db/users/getUser/index.ts
import { eq, and, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { usersTable } from "../../../../../db/schemas/usersTable";
import { userNamesTable } from "../../../../../db/schemas/userNamesTable";

export async function getUser(db: PostgresJsDatabase, userId: string) {
  const result = await db
    .select({
      id: usersTable.id,
      supabaseAuthId: usersTable.supabaseAuthId,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
      name: userNamesTable.name,
    })
    .from(usersTable)
    .leftJoin(
      userNamesTable,
      and(
        eq(usersTable.id, userNamesTable.userId),
        isNull(userNamesTable.deletedAt),
      ),
    )
    .where(
      and(eq(usersTable.supabaseAuthId, userId), isNull(usersTable.deletedAt)),
    )
    .limit(1);

  return result[0] || null;
}
```

**INSERT:**

```typescript
// apps/core/src/data-access/db/users/storeUserName/index.ts
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { userNamesTable } from "../../../../../db/schemas/userNamesTable";

export const storeUserName = async (
  db: PostgresJsDatabase,
  data: { userId: string; name: string }
) => {
  const [user] = await db.insert(userNamesTable).values(data).returning();

  return user || null;
};
```

**UPDATE:**

```typescript
// apps/core/src/data-access/db/users/updateUserNameRecord/index.ts
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { userNamesTable } from "../../../../../db/schemas/userNamesTable";

export const updateUserNameRecord = async (
  db: PostgresJsDatabase,
  data: { userNameId: string; name: string },
) => {
  const [result] = await db
    .update(userNamesTable)
    .set({ name: data.name, updatedAt: new Date() })
    .where(eq(userNamesTable.id, data.userNameId))
    .returning();

  return result || null;
};
```

**インポート例（Action 層から）:**

```typescript
// apps/core/src/actions/storeUserName/index.ts
import { getUserById } from "../../data-access/db/users/getUserById";
import { getUserNameByUserId } from "../../data-access/db/users/getUserNameByUserId";
import { storeUserName as storeUserNameFromDB } from "../../data-access/db/users/storeUserName";

export const storeUserName = async ({ userId, name }: StoreUserName) => {
  return await transactionDB.transaction(async (tx) => {
    const user = await getUserById(tx, userId);
    const existingUserName = await getUserNameByUserId(tx, user.id);
    const result = await storeUserNameFromDB(tx, { userId: user.id, name });
    return result;
  });
};
```

### 4. Database Layer

Drizzle ORM を使用したデータベース層です。

#### ディレクトリ構造

```
apps/core/
├── db/
│   ├── client/
│   │   └── transaction/
│   │       └── index.ts              # トランザクション用 DB クライアント
│   ├── schemas/
│   │   ├── usersTable.ts             # ユーザーテーブル定義
│   │   └── userNamesTable.ts         # ユーザー名テーブル定義
│   └── migrations/
│       ├── 20251124073214_create_users.sql
│       ├── 20251124073215_create_function_handle_new_user.sql
│       ├── 20251124073216_create_trigger_on_auth_user_created.sql
│       ├── 20251130103911_create_user_names_table.sql
│       └── meta/
│           ├── _journal.json
│           └── snapshots (*.json)
├── drizzle.config.ts                 # Drizzle Kit 設定
└── utils/
    └── config/
        └── env/
            └── index.ts              # 環境変数
```

#### スキーマ定義

**Soft Delete 対応のスキーマ:**

```typescript
// apps/core/db/schemas/usersTable.ts
import { timestamp, pgTable, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const usersTable = pgTable("users_table", {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  supabaseAuthId: uuid("supabase_auth_id").unique().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
```

**外部キー参照を持つスキーマ:**

```typescript
// apps/core/db/schemas/userNamesTable.ts
import { timestamp, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./usersTable";

export const userNamesTable = pgTable("user_names_table", {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export type InsertUserName = typeof userNamesTable.$inferInsert;
export type SelectUserName = typeof userNamesTable.$inferSelect;
```

#### Drizzle 設計パターン

##### Soft Delete の扱い

**全てのテーブルに `deletedAt` カラムを追加し、クエリ時に必ず `isNull(table.deletedAt)` を条件に含める。**

```typescript
// SELECT 時は必ず deletedAt をチェック
const result = await db
  .select()
  .from(usersTable)
  .where(
    and(
      eq(usersTable.supabaseAuthId, supabaseAuthId),
      isNull(usersTable.deletedAt),  // 必須条件
    ),
  )
  .limit(1);
```

JOIN 時も両テーブルで `deletedAt` をチェック:

```typescript
.leftJoin(
  userNamesTable,
  and(
    eq(usersTable.id, userNamesTable.userId),
    isNull(userNamesTable.deletedAt),  // JOIN 条件にも含める
  ),
)
.where(
  and(eq(usersTable.supabaseAuthId, userId), isNull(usersTable.deletedAt)),
)
```

##### タイムスタンプの自動更新

`createdAt` と `updatedAt` は自動的に設定されます。

```typescript
createdAt: timestamp("created_at").notNull().defaultNow(),
updatedAt: timestamp("updated_at")
  .notNull()
  .$onUpdate(() => new Date()),  // 更新時に自動設定
```

##### トランザクション管理

トランザクションが必要な処理では `transactionDB` を使用します。

```typescript
// apps/core/db/client/transaction/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { postgresUrl } from "../../../utils/config/env";

const transactionClient = postgres(postgresUrl, {
  max: 5,
  idle_timeout: 30,
  connect_timeout: 10,
  prepare: false,
});
export const transactionDB = drizzle(transactionClient);
```

**Action 層での使用:**

```typescript
import { transactionDB } from "../../../db/client/transaction";

export const storeUserName = async ({ userId, name }: StoreUserName) => {
  return await transactionDB.transaction(async (tx) => {
    const user = await getUserById(tx, userId);
    // ... tx を各 data-access 関数に渡す
  });
};
```

## 認証・認可

### 認証の現状

現在、認証チェック（Supabase Auth のトークン検証）は **未実装** です。
Route 層から Action 層に渡される `userId` は Supabase Auth の UUID（`supabaseAuthId`）ですが、
リクエストヘッダーからのトークン検証は行われていません。

Action 層のコードには認証チェックの TODO コメントが残されています:

```typescript
// TODO: 認証ユーザーのチェックを追加
// if (user.supabaseAuthId !== authUserId) {
//   throw new Error(
//     "Forbidden: You don't have permission to register this user's name",
//   );
// }
```

### 認証ミドルウェア [FUTURE]

> **注意**: `apps/core/src/middleware/` ディレクトリは現在存在しません。

将来的に Hono ミドルウェアとして認証を実装予定:

```typescript
// [FUTURE] 認証ミドルウェア
import { createMiddleware } from "hono/factory";

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.substring(7);
  // Supabase Auth でトークン検証
  // ...
  await next();
});
```

### 認可の実装 [FUTURE]

ユーザーごとのアクセス制御は、Action 層で実装予定です。
現在は TODO コメントとして記載されています。

## エラーハンドリング

### 基本原則

**Route 層に try-catch を書かない。** エラーは Action 層から throw し、上位に伝播させる。

> 詳細: `.claude/rules/error-handling.md`

### 現在のエラーハンドリングフロー

```
1. Route 層: バリデーションエラーのみ zValidator で処理
2. Action 層: throw new Error() でエラーを伝播
3. グローバルハンドラ: [FUTURE] 未実装、Hono/Next.js デフォルトに依存
```

### エラーの種類

1. **バリデーションエラー**: zValidator のコールバックで 400 を返却
2. **ビジネスロジックエラー**: Action 層で `throw new Error()` → 現状は 500 として伝播
3. **システムエラー**: 予期しないエラー → 現状は 500 として伝播

### バリデーションエラー（実装済み）

zValidator のコールバックで処理する形式が確立されています:

```typescript
zValidator("param", paramsSchema, (result, c) => {
  if (!result.success) {
    console.log(result.error);
    return c.json({ error: "Invalid parameter" }, 400);
  }
}),
```

### ビジネスロジックエラー（実装済み）

Action 層で throw するパターンが確立されています:

```typescript
// ユーザーが存在しない
throw new Error("ユーザーが存在しません");

// ユーザー名が既に存在する
throw new Error("ユーザー名が既に存在します");

// 操作が失敗した
throw new Error("ユーザー名の登録に失敗しました");
```

### グローバルエラーハンドラ [FUTURE]

> 未実装。実装時は `app.onError()` で統一的にエラーを処理予定。
> 詳細: `.claude/rules/error-handling.md`

## データフロー例

### ユーザー名登録のフロー（POST /api/users/:userId/name）

```
1. POST /api/users/:userId/name  { name: "Alice" }
   ↓
2. Route Layer (users/storeUserName/index.ts)
   - zValidator で JSON body と params をバリデーション
   - Action 層を呼び出し
   ↓
3. Action Layer (actions/storeUserName/index.ts)
   - transactionDB.transaction() 開始
   - getUserById(tx, userId) でユーザー存在確認
   - getUserNameByUserId(tx, user.id) で重複チェック
   - storeUserNameFromDB(tx, { userId, name }) で保存
   ↓
4. Data Access Layer (data-access/db/users/)
   - getUserById: supabaseAuthId でユーザー検索（deletedAt IS NULL）
   - getUserNameByUserId: userId でユーザー名検索（deletedAt IS NULL）
   - storeUserName: userNamesTable に INSERT
   ↓
5. Database Layer
   - Drizzle ORM でクエリ実行
   - PostgreSQL にデータ保存
   ↓
6. レスポンス返却
   - 201 Created
   - { id: "uuid" }
```

### ユーザー取得のフロー（GET /api/users/:userId）

```
1. GET /api/users/:userId
   ↓
2. Route Layer (users/getUser/index.ts)
   - zValidator で params をバリデーション
   - Action 層を呼び出し
   ↓
3. Action Layer (actions/getUser/index.ts)
   - transactionDB.transaction() 開始
   - getUser(tx, userId) で JOIN クエリ実行
   - ユーザーが存在しなければ throw
   - 必要なフィールドのみ返却
   ↓
4. Data Access Layer (data-access/db/users/getUser/)
   - usersTable と userNamesTable を LEFT JOIN
   - 両テーブルで deletedAt IS NULL をチェック
   ↓
5. レスポンス返却
   - 200 OK
   - { id, name, createdAt, updatedAt }
```

## ベストプラクティス

### DO: 実装すべきこと

#### Route 層は薄く保つ

```typescript
// apps/core/src/app/api/[[...route]]/users/getUser/index.ts
const app = new Hono().get(
  "/:userId",
  zValidator("param", paramsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid parameter" }, 400);
    }
  }),
  async (c) => {
    const { userId } = c.req.valid("param");
    const result = await getUser({ userId });
    return c.json(result, 200);
  },
);
```

#### データアクセス層への集約（一ファイル一関数）

```typescript
// apps/core/src/data-access/db/users/getUserById/index.ts
export async function getUserById(db: DB, supabaseAuthId: string) {
  const result = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.supabaseAuthId, supabaseAuthId),
        isNull(usersTable.deletedAt),
      ),
    )
    .limit(1);

  return result[0] || null;
}
```

#### Action 層でトランザクションとビジネスルールを管理

```typescript
// apps/core/src/actions/storeUserName/index.ts
export const storeUserName = async ({ userId, name }: StoreUserName) => {
  return await transactionDB.transaction(async (tx) => {
    const user = await getUserById(tx, userId);
    if (!user) {
      throw new Error("ユーザーが存在しません");
    }
    // ... ビジネスルールのチェック、データ操作
  });
};
```

#### Soft Delete の徹底

```typescript
// 取得時は必ず deletedAt をチェック
.where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)))

// JOIN 時も両テーブルでチェック
.leftJoin(
  userNamesTable,
  and(
    eq(usersTable.id, userNamesTable.userId),
    isNull(userNamesTable.deletedAt),
  ),
)
```

### DON'T: 避けるべきこと

#### Route 層でのビジネスロジック

```typescript
// Route 層でビジネスロジックを直接実装しない
const app = new Hono().post("/:userId/name", async (c) => {
  const { userId } = c.req.valid("param");

  // ビジネスロジックをここに書かない
  const user = await transactionDB.transaction(async (tx) => {
    const user = await tx.insert(usersTable).values(body).returning();
    // ...
  });

  return c.json(user);
});

// Action 層を呼び出す
const app = new Hono().post("/:userId/name", async (c) => {
  const { userId } = c.req.valid("param");
  const { name } = c.req.valid("json");
  const result = await storeUserName({ userId, name });
  return c.json({ id: result.id }, 201);
});
```

#### Action 層での直接的なクエリ

```typescript
// Action 層で直接クエリを書かない
export const getUser = async ({ userId }: GetUser) => {
  return await transactionDB.transaction(async (tx) => {
    const result = await tx
      .select()
      .from(usersTable)
      .where(eq(usersTable.supabaseAuthId, userId));
    return result[0];
  });
};

// data-access 層の関数を使用する
import { getUser as getUserFromDB } from "../../data-access/db/users/getUser";

export const getUser = async ({ userId }: GetUser) => {
  return await transactionDB.transaction(async (tx) => {
    const user = await getUserFromDB(tx, userId);
    return user;
  });
};
```

#### Route 層での try-catch

```typescript
// Route 層で try-catch を使わない
const app = new Hono().get("/:userId", async (c) => {
  try {
    const result = await getUser({ userId });
    return c.json(result, 200);
  } catch (error) {
    return c.json({ error: "..." }, 500);
  }
});

// エラーは上位に伝播させる
const app = new Hono().get("/:userId", async (c) => {
  const { userId } = c.req.valid("param");
  const result = await getUser({ userId });
  return c.json(result, 200);
});
```

#### deletedAt のチェック漏れ

```typescript
// deletedAt をチェックしない
export async function getAllUsers(db: DB) {
  return await db.select().from(usersTable);
}

// 必ず deletedAt をチェック
export async function getAllUsers(db: DB) {
  return await db
    .select()
    .from(usersTable)
    .where(isNull(usersTable.deletedAt));
}
```

## 現在の API エンドポイント一覧

| Method | Path | Route File | Action | Description |
|--------|------|-----------|--------|-------------|
| GET | `/api/users/:userId` | `users/getUser/index.ts` | `getUser` | ユーザー取得（ユーザー名含む） |
| POST | `/api/users/:userId/name` | `users/storeUserName/index.ts` | `storeUserName` | ユーザー名の新規登録 |
| POST | `/api/users/:userId/name/update` | `users/updateUserName/index.ts` | `updateUserName` | ユーザー名の更新 |

## まとめ

Core パッケージは、以下の原則に基づいて設計されています:

1. **レイヤー分離**: Route / Action / Data Access / Database を明確に分離
2. **一ファイル一関数**: data-access 層は各関数をディレクトリで独立管理
3. **エラー伝播**: Route 層に try-catch を置かず、Action 層で throw して上位に伝播
4. **データアクセスの集約**: 全てのクエリを `data-access/` に集約
5. **Soft Delete の徹底**: 全テーブルで `deletedAt` を管理、クエリ時に必ずチェック
6. **トランザクション管理**: Action 層で `transactionDB.transaction()` を使い、tx を data-access 関数に渡す

### 未実装項目 [FUTURE]

- グローバルエラーハンドラ（`app.onError()`）
- 認証ミドルウェア（Supabase Auth トークン検証）
- 認可チェック（Action 層での権限検証）
- エラーの種類に応じた HTTP ステータスコードの分類（400/401/403/404/500）
