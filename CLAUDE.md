# コミットメッセージの規約
@docs/dev/commit-message.md

# 環境変数の管理

## 重要なルール

新しい環境変数を`.env.local`や`.env`ファイルに追加または削除する際は、`turbo.json`のキャッシュキーに含める必要があります。

## 理由

環境変数の変更がTurborepoのキャッシュキーに含まれていないと、環境変数の値が変わってもキャッシュが無効化されず、古いビルド結果が使用されてしまう可能性があります。

## 手順

1. `.env.local`または`.env`ファイルに環境変数を追加/削除
2. `turbo.json`を開く
3. 該当するタスク（例: `@repo/core`）の`env`配列に環境変数名を追加

### 例

**turbo.json**

```json
{
  "tasks": {
    "@repo/core": {
      "env": ["POSTGRES_URL"]
    }
  }
}
```

# データベーススキーマの管理

## スキーマファイルの命名規則

新しいテーブルのスキーマを作成する場合は、以下の命名規則に従ってください：

- ファイル名：`テーブル名Table.ts`（テーブル名はキャメルケース）
- 例：`usersTable.ts`, `postsTable.ts`, `userProfilesTable.ts`

## マイグレーションファイルの命名規則

### テーブルの新規作成

- ファイル名：`timestamp_create_テーブル名.sql`（テーブル名はスネークケース）
- 例：`20240101120000_create_users.sql`, `20240101120000_create_user_profiles.sql`

### テーブルの変更

- ファイル名：`timestamp_操作_table名_カラム名.sql`
- 操作：`add`, `drop`, `rename` など
- 例：
  - `20240101120000_add_users_email.sql`
  - `20240101120000_drop_posts_title.sql`
  - `20240101120000_rename_users_name_to_full_name.sql`

### トリガーやファンクションの作成

- ファイル名：何をしているかわかるように命名
- 例：
  - `20240101120000_create_function_update_timestamp.sql`
  - `20240101120000_create_trigger_users_update.sql`

## マイグレーションファイルの作成手順

### 手順

1. **スキーマファイルを作成または変更**
   - `apps/core/db/schemas/`ディレクトリに`テーブル名Table.ts`を作成
   - 例：`usersTable.ts`, `postsTable.ts`

2. **マイグレーションファイルを生成**
   - コマンド：`bun run db:generate --name 操作名`
   - `--name`オプションで命名規則に従った名前を指定

3. **生成されるファイル名の形式**
   - `YYYYMMDDHHmmss_指定した名前.sql`
   - 例：`20251124071741_create_users.sql`

### 例

**テーブル作成の場合：**

```bash
bun run db:generate --name create_users
# → 20251124071741_create_users.sql が生成される
```

**カラム追加の場合：**

```bash
bun run db:generate --name add_users_email
# → 20251124071741_add_users_email.sql が生成される
```

**ファンクション作成の場合：**

```bash
bun run db:generate --name create_function_handle_new_user
# → 20251124071741_create_function_handle_new_user.sql が生成される
```

**トリガー作成の場合：**

```bash
bun run db:generate --name create_trigger_on_auth_user_created
# → 20251124071741_create_trigger_on_auth_user_created.sql が生成される
```

# ディレクトリ構造の確認

## treeコマンド

ディレクトリ構造を確認する際は、`tree`コマンドを使用してください。

### 基本的な使い方

```bash
# 特定のディレクトリの構造を表示
tree /path/to/directory

# node_modulesを除外して表示
tree /path/to/directory -I node_modules

# 特定の深さまで表示
tree /path/to/directory -L 2
```

### よく使うパターン

```bash
# authパッケージの構造を確認
tree /Users/nikawadori/ghq/github.com/nikawa2161/ribon/packages/auth/src -I node_modules

# プロジェクト全体の構造を確認（2階層まで）
tree /Users/nikawadori/ghq/github.com/nikawa2161/ribon -L 2 -I node_modules
```

## 使用タイミング

- パッケージ構造を再構成した後
- 新しいディレクトリやファイルを追加した後
- ファイル移動や削除を行った後
- ユーザーに構造を説明する際

# Zodバリデーション

## 基本方針

Zodのバリデーションは、公式ドキュメントの推奨に従って実装してください。

## UUID バリデーション（Zod v4）

### 推奨される実装

UUIDのバリデーションには、トップレベル関数の`z.uuid()`を使用してください。

**正しい実装:**
```typescript
const paramsSchema = z.object({
  userId: z.uuid(),
});
```

**非推奨の実装:**
```typescript
// ❌ Zod v3の書き方（非推奨）
const paramsSchema = z.object({
  userId: z.string().uuid(),
});
```

### UUID バリデーションの種類

#### 厳密な検証（推奨）
```typescript
// RFC 9562/4122仕様に準拠した厳密な検証
z.uuid()
```

#### 緩い検証
```typescript
// 8-4-4-4-12のhexパターンを受け入れる緩い検証
z.guid()
```

### カスタムエラーメッセージ

```typescript
z.uuid("不正なUUID形式です")
// または
z.uuid({ message: "不正なUUID形式です" })
```

## その他の推奨バリデーション

### 文字列の長さ制限

```typescript
z.string().min(1).max(255)
```

### メール

```typescript
z.email()  // トップレベル関数（推奨）
// ❌ z.string().email()  // 非推奨
```

### URL

```typescript
z.url()  // トップレベル関数（推奨）
// ❌ z.string().url()  // 非推奨
```

## 実装例

### APIエンドポイントのバリデーション

```typescript
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

// パラメータのスキーマ
const paramsSchema = z.object({
  userId: z.uuid(),
});

// リクエストボディのスキーマ
const requestSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.email(),
});

// Honoでの使用例
app.post(
  "/:userId",
  zValidator("param", paramsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid parameter" }, 400);
    }
  }),
  zValidator("json", requestSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid JSON" }, 400);
    }
  }),
  async (c) => {
    const { userId } = c.req.valid("param");
    const { name, email } = c.req.valid("json");
    // ...
  }
);
```

## 参考リンク

- [Zod公式ドキュメント](https://zod.dev/)
- [Zod v4 Migration Guide](https://zod.dev/v4/changelog)

# BFFアーキテクチャ

## 概要

このプロジェクトは、Backend for Frontend（BFF）アーキテクチャパターンを採用しています。

詳細は以下のドキュメントを参照してください：
@docs/architecture/bff-pattern.md

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
