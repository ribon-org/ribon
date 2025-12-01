# Core パッケージのアーキテクチャ

## 概要

`@repo/core` は、BFF（Backend for Frontend）として機能するパッケージです。
ビジネスロジックの実装、外部サービスとの連携、データの変換・加工を担当します。

## アーキテクチャの全体像

```
┌─────────────────────────────────────────────────────────┐
│ Route Layer (Next.js App Router + Hono)                 │
│ - リクエストの受付とバリデーション                          │
│ - ドメインごとのルーター分割                               │
│ - エラーハンドリング                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Business Logic Layer                                    │
│ - ビジネスルールの実装                                     │
│ - 複数のデータソースの調整                                 │
│ - トランザクション制御                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Data Access Layer                                       │
│ - データベースクエリの実装                                 │
│ - 外部APIとの連携                                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Database / External Services                            │
│ - PostgreSQL (via Drizzle ORM)                          │
│ - Supabase Auth                                         │
│ - その他外部サービス                                      │
└─────────────────────────────────────────────────────────┘
```

## レイヤー設計

### 1. Route Layer

Next.js の App Router と Hono を組み合わせたルーティング層です。

#### 責務

- リクエストの受付
- Zod によるリクエストバリデーション
- レスポンスの返却
- エラーハンドリング

#### ディレクトリ構造（設計方針）

```
apps/core/src/
├── app/
│   └── api/
│       └── [[...route]]/
│           └── route.ts          # Hono のエントリーポイント
└── routes/
    ├── index.ts                  # ルーターの統合
    ├── users.ts                  # ユーザー関連のルーター
    ├── companies.ts              # 会社関連のルーター
    └── projects.ts               # プロジェクト関連のルーター
```

#### ドメインルーターの分割

各ドメインは独立したルーターを持ち、担当領域ごとに役割を持ちます。

```typescript
// apps/core/src/routes/users.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const users = new Hono();

// GET /api/users
users.get("/", async (c) => {
  // ビジネスロジック層を呼び出し
  const users = await getAllUsers();
  return c.json(users);
});

// POST /api/users
users.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).max(255),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    const user = await createUser(body);
    return c.json(user, 201);
  }
);

export default users;
```

#### グローバルエラーハンドリング

`.onError()` により、未処理エラーをグローバルに捕捉します。

```typescript
// apps/core/src/routes/index.ts
import { Hono } from "hono";
import users from "./users";
import companies from "./companies";

const app = new Hono();

// ドメインルーターを統合
app.route("/users", users);
app.route("/companies", companies);

// グローバルエラーハンドリング
app.onError((err, c) => {
  console.error("Unhandled error:", err);

  if (err instanceof ZodError) {
    return c.json({ error: "Validation failed", details: err.errors }, 400);
  }

  return c.json({ error: "Internal server error" }, 500);
});

export default app;
```

#### Next.js との統合

```typescript
// apps/core/src/app/api/[[...route]]/route.ts
import { handle } from "hono/vercel";
import app from "@/routes";

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
```

### 2. Business Logic Layer

ビジネスルールを実装する層です。

#### 責務

- ビジネスロジックの実装
- 複数のデータソースの調整・集約
- トランザクションの制御
- ドメインルールの適用

#### ディレクトリ構造（設計方針）

```
apps/core/src/
└── services/
    ├── users/
    │   ├── create-user.ts
    │   ├── get-user.ts
    │   └── update-user.ts
    ├── companies/
    │   ├── create-company.ts
    │   └── get-company.ts
    └── projects/
        └── ...
```

#### 実装例

```typescript
// apps/core/src/services/users/create-user.ts
import { transactionDB } from "@/db/client/transaction";
import { insertUser, insertUserName } from "@/data-access/users";

export async function createUser(input: { name: string; authId: string }) {
  return await transactionDB.transaction(async (tx) => {
    // 1. ユーザーを作成
    const user = await insertUser(tx, {
      supabaseAuthId: input.authId,
    });

    // 2. ユーザー名を作成
    await insertUserName(tx, {
      userId: user.id,
      name: input.name,
    });

    return user;
  });
}
```

### 3. Data Access Layer

データベースやAPIとのやり取りを担当する層です。

#### 責務

- データベースクエリの実装
- 外部APIとの連携
- データの永続化・取得

#### ディレクトリ構造（設計方針）

**一ファイル一関数の原則**

各関数は独立したディレクトリに配置し、`index.ts` として実装します。

```
apps/core/src/
└── data-access/
    ├── db/
    │   ├── users/
    │   │   ├── getUserById/
    │   │   │   └── index.ts
    │   │   ├── getUserNameByUserId/
    │   │   │   └── index.ts
    │   │   ├── insertUserName/
    │   │   │   └── index.ts
    │   │   └── updateUserNameRecord/
    │   │       └── index.ts
    │   ├── companies/
    │   │   ├── getCompanyById/
    │   │   │   └── index.ts
    │   │   └── insertCompany/
    │   │       └── index.ts
    │   └── projects/
    │       └── ...
    └── api/
        └── external-service.ts   # 外部API連携
```

この構造により、以下のメリットがあります：

- 関数の責務が明確になる
- ファイルの肥大化を防ぐ
- テストファイルを関数ごとに配置できる
- インポートパスが明確になる

#### DB 層の設計原則

**全てのクエリを `src/data-access/db/**` に集約する**

- ビジネスロジック層やルート層から直接 Drizzle のクエリを書かない
- データアクセスのロジックを一箇所に集約することで、保守性を向上

**一ファイル一関数での実装例:**

```typescript
// apps/core/src/data-access/db/users/getUserById/index.ts
import { eq, and, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { usersTable } from "@/db/schemas/usersTable";

export type DB = PostgresJsDatabase<Record<string, never>>;

/**
 * ユーザーをIDで取得（Soft Delete対応）
 */
export async function getUserById(db: DB, userId: string) {
  const result = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)))
    .limit(1);

  return result[0] || null;
}
```

```typescript
// apps/core/src/data-access/db/users/insertUserName/index.ts
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { userNamesTable } from "@/db/schemas/userNamesTable";

export type DB = PostgresJsDatabase<Record<string, never>>;

/**
 * ユーザー名を新規作成
 */
export async function insertUserName(
  db: DB,
  data: { userId: string; name: string },
) {
  const [result] = await db.insert(userNamesTable).values(data).returning();

  return result;
}
```

**インポート例:**

```typescript
// apps/core/src/services/users/register-user-name.ts
import { getUserById } from "@/data-access/db/users/getUserById";
import { getUserNameByUserId } from "@/data-access/db/users/getUserNameByUserId";
import { insertUserName } from "@/data-access/db/users/insertUserName";

export async function registerUserName(input: RegisterUserNameInput) {
  return await transactionDB.transaction(async (tx) => {
    const user = await getUserById(tx, input.userId);
    const existingUserName = await getUserNameByUserId(tx, input.userId);
    const result = await insertUserName(tx, { userId: input.userId, name: input.name });
    return result;
  });
}
```

### 4. Database Layer

Drizzle ORM を使用したデータベース層です。

#### ディレクトリ構造

```
apps/core/
├── db/
│   ├── client/
│   │   └── transaction/
│   │       └── index.ts          # トランザクション用クライアント
│   ├── schemas/
│   │   ├── usersTable.ts         # ユーザーテーブル定義
│   │   └── userNamesTable.ts     # ユーザー名テーブル定義
│   └── migrations/               # マイグレーションファイル
│       ├── 20251124073214_create_users.sql
│       └── ...
└── drizzle.config.ts             # Drizzle 設定ファイル
```

#### Drizzle 設計パターン

##### Soft Delete の扱い

**全てのテーブルに `deletedAt` カラムを追加し、クエリ時に必ず `deletedAt IS NULL` を条件に含める**

```typescript
// スキーマ定義
export const usersTable = pgTable("users_table", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  supabaseAuthId: uuid("supabase_auth_id").unique().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"), // Soft delete用
});

// クエリ時は必ず deletedAt をチェック
export async function getActiveUsers(db: DB) {
  return await db
    .select()
    .from(usersTable)
    .where(isNull(usersTable.deletedAt)); // ✅ 必須条件
}
```

##### タイムスタンプの自動更新

`createdAt` と `updatedAt` は自動的に設定されるようにします。

```typescript
export const usersTable = pgTable("users_table", {
  // ...
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()), // 更新時に自動設定
});
```

##### トランザクション管理

トランザクションが必要な処理では、`transactionDB` を使用します。

```typescript
// apps/core/db/client/transaction/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { postgresUrl } from "../../../utils/config/env";

const transactionClient = postgres(postgresUrl, {
  max: 5,                  // 最大接続数
  idle_timeout: 30,        // アイドルタイムアウト（秒）
  connect_timeout: 10,     // 接続タイムアウト（秒）
  prepare: false,          // プリペアドステートメントを無効化（トランザクション用）
});

export const transactionDB = drizzle(transactionClient);
```

**使用例:**

```typescript
import { transactionDB } from "@/db/client/transaction";

export async function createUserWithProfile(data: UserInput) {
  return await transactionDB.transaction(async (tx) => {
    const user = await insertUser(tx, data.user);
    const profile = await insertProfile(tx, {
      userId: user.id,
      ...data.profile,
    });
    return { user, profile };
  });
}
```

## 認証・認可

### 認証の流れ

coreパッケージでは、Supabase Auth で発行されたセッションを利用してユーザーを識別します。

```typescript
// apps/core/src/middleware/auth.ts
import { createMiddleware } from "hono/factory";
import { createClient } from "@supabase/supabase-js";

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", user);
  await next();
});
```

### 認可の実装

ユーザーごとのアクセス制御は、ビジネスロジック層で実装します。

```typescript
// apps/core/src/services/companies/update-company.ts
export async function updateCompany(
  userId: string,
  companyId: string,
  data: UpdateCompanyInput
) {
  // 権限チェック
  const hasPermission = await checkUserCompanyPermission(userId, companyId);

  if (!hasPermission) {
    throw new Error("Forbidden: You don't have permission to update this company");
  }

  return await updateCompanyData(companyId, data);
}
```

## エラーハンドリング

### エラーの種類

coreパッケージでは、以下のエラーを区別して処理します：

1. **バリデーションエラー**: リクエストの形式が不正
2. **認証エラー**: 認証情報が不正または期限切れ
3. **認可エラー**: アクセス権限がない
4. **ビジネスロジックエラー**: ビジネスルール違反
5. **システムエラー**: 予期しないエラー

### エラーレスポンスの形式

```typescript
// 400 Bad Request (バリデーションエラー)
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}

// 401 Unauthorized (認証エラー)
{
  "error": "Unauthorized"
}

// 403 Forbidden (認可エラー)
{
  "error": "Forbidden: You don't have permission to access this resource"
}

// 500 Internal Server Error (システムエラー)
{
  "error": "Internal server error"
}
```

## データフロー例

### ユーザー作成のフロー

```
1. POST /api/users
   ↓
2. Route Layer (routes/users.ts)
   - Zod でバリデーション
   - authMiddleware で認証チェック
   ↓
3. Business Logic Layer (services/users/create-user.ts)
   - トランザクション開始
   - ビジネスルール適用
   ↓
4. Data Access Layer (data-access/db/users.ts)
   - insertUser() を実行
   - insertUserName() を実行
   ↓
5. Database Layer
   - Drizzle ORM でクエリ実行
   - PostgreSQL にデータ保存
   ↓
6. レスポンス返却
   - 201 Created
   - ユーザー情報を JSON で返却
```

## ベストプラクティス

### DO: 実装すべきこと

#### ドメインごとのルーター分割

```typescript
// ✅ ドメインごとにルーターを分割
// apps/core/src/routes/users.ts
const users = new Hono();
users.get("/", getAllUsers);
users.post("/", createUser);

// apps/core/src/routes/companies.ts
const companies = new Hono();
companies.get("/", getAllCompanies);
companies.post("/", createCompany);
```

#### データアクセス層への集約（一ファイル一関数）

```typescript
// ✅ データアクセスロジックを data-access/ に集約し、一ファイル一関数で実装
// apps/core/src/data-access/db/users/getUserById/index.ts
export async function getUserById(db: DB, userId: string) {
  const result = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)))
    .limit(1);

  return result[0] || null;
}

// apps/core/src/services/users/get-user.ts
import { getUserById } from "@/data-access/db/users/getUserById";

export async function getUser(userId: string) {
  return await getUserById(transactionDB, userId);
}
```

#### Soft Delete の徹底

```typescript
// ✅ 削除時は deletedAt を更新
export async function softDeleteUser(db: DB, userId: string) {
  return await db
    .update(usersTable)
    .set({ deletedAt: new Date() })
    .where(eq(usersTable.id, userId));
}

// ✅ 取得時は deletedAt をチェック
export async function getActiveUsers(db: DB) {
  return await db
    .select()
    .from(usersTable)
    .where(isNull(usersTable.deletedAt));
}
```

### DON'T: 避けるべきこと

#### ルート層でのビジネスロジック

```typescript
// ❌ ルート層でビジネスロジックを直接実装
users.post("/", async (c) => {
  const body = c.req.valid("json");

  // ビジネスロジックをここに書かない
  const user = await transactionDB.transaction(async (tx) => {
    const user = await tx.insert(usersTable).values(body).returning();
    // ...
  });

  return c.json(user);
});

// ✅ ビジネスロジック層を呼び出す
users.post("/", async (c) => {
  const body = c.req.valid("json");
  const user = await createUser(body);
  return c.json(user);
});
```

#### ビジネスロジック層での直接的なクエリ

```typescript
// ❌ ビジネスロジック層で直接クエリを書かない
export async function getUser(userId: string) {
  return await transactionDB
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
}

// ✅ データアクセス層の関数を使用（一ファイル一関数）
import { getUserById } from "@/data-access/db/users/getUserById";

export async function getUser(userId: string) {
  return await getUserById(transactionDB, userId);
}
```

#### deletedAt のチェック漏れ

```typescript
// ❌ deletedAt をチェックしない
export async function getAllUsers(db: DB) {
  return await db.select().from(usersTable);
}

// ✅ 必ず deletedAt をチェック
export async function getAllUsers(db: DB) {
  return await db
    .select()
    .from(usersTable)
    .where(isNull(usersTable.deletedAt));
}
```

## まとめ

coreパッケージは、以下の原則に基づいて設計されています：

1. **レイヤー分離**: Route、Business Logic、Data Access を明確に分離
2. **ドメイン駆動**: ドメインごとにルーターとロジックを分割
3. **データアクセスの集約**: 全てのクエリを `data-access/` に集約
4. **Soft Delete の徹底**: 全テーブルで `deletedAt` を管理
5. **トランザクション管理**: 複数テーブル操作時は必ずトランザクションを使用

この設計により、保守性が高く、テストしやすい BFF を実現します。
