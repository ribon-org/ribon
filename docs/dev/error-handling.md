# エラーハンドリング規約

## 基本方針

**ルート（APIエンドポイント）にtry-catchを置かない**

エラーハンドリングロジックをルートに分散させず、上位層で一元管理する設計を採用します。

## 理由

1. **責務の分離**: ルートはビジネスロジックの呼び出しに専念すべき
2. **一元管理**: エラーハンドリングを一箇所に集約することで保守性向上
3. **将来性**: グローバルエラーハンドラーで統一的なエラーレスポンスを提供予定

## 層ごとの責務

### ルート層（API Routes）

```typescript
// ✅ 推奨パターン
async (c) => {
  const { userId } = c.req.valid("param");
  const result = await someAction({ userId });
  return c.json(result, 200);
}
```

```typescript
// ❌ 避けるべきパターン
async (c) => {
  try {
    const { userId } = c.req.valid("param");
    const result = await someAction({ userId });
    return c.json(result, 200);
  } catch (error) {
    // ルートでエラーハンドリングしない
    return c.json({ error: "..." }, 500);
  }
}
```

**責務**:
- リクエストの受付
- バリデーション（zValidator使用）
- アクション層の呼び出し
- レスポンスの返却

**やらないこと**:
- try-catchによるエラーキャッチ
- エラーメッセージの加工
- エラーログの出力

### アクション層（Business Logic）

```typescript
// ✅ エラーは throw でそのまま伝播
export async function getUser({ userId }: { userId: string }) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
```

**責務**:
- ビジネスロジックの実装
- データベースアクセス
- エラー時は `throw new Error()` で伝播

### エラーハンドラー層

#### 現在の挙動

エラーはHono/Next.jsのデフォルトエラーハンドラーで処理されます。

```
アクション層 → throw new Error()
    ↓
ルート層 → エラーハンドリングなし（伝播）
    ↓
Hono/Next.jsのデフォルトエラーハンドラー
```

**制約**:
- エラーレスポンスの形式が統一されていない
- エラーログが適切に出力されない可能性

#### 将来の実装予定

Honoのグローバルエラーハンドラー（`app.onError()`）を実装予定。

```typescript
// 将来の実装イメージ
app.onError((err, c) => {
  console.error("Error:", err);

  return c.json({
    error: err.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
  }, 500);
});
```

**メリット**:
- 全てのエラーを一箇所で処理
- 統一されたエラーレスポンス形式
- エラーログの一元管理
- エラー監視サービスとの連携が容易

## 実装例

### core API（Honoルート）

```typescript
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

    // try-catchなし - エラーは上位に伝播
    const result = await getUser({ userId });
    return c.json(result, 200);
  },
);

export default app;
```

### BFF API（Next.js API Routes）

```typescript
import { coreClient } from "../../../../../lib/coreClient";
import { zValidator } from "@hono/zod-validator";
import { paramsSchema } from "./schema";

const app = new Hono().get(
  "/:userId",
  zValidator("param", paramsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid parameter" }, 400);
    }
  }),
  async (c) => {
    const { userId } = c.req.valid("param");

    // coreClientでcore APIを呼び出し
    const response = await coreClient.api.users[":userId"].$get({
      param: { userId },
    });

    const data = await response.json();

    // エラーレスポンスをそのまま返す
    if (!response.ok) {
      return c.json(data, 400);
    }

    return c.json(data, 200);
  }
);
```

### アクション層

```typescript
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getUser({ userId }: { userId: string }) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    // エラーをthrowして上位に伝播
    throw new Error("User not found");
  }

  return {
    id: user.id,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
```

## バリデーションエラー

バリデーションエラーは各層で適切に処理します。

```typescript
// ✅ zValidatorでバリデーション
zValidator("param", paramsSchema, (result, c) => {
  if (!result.success) {
    console.log(result.error);
    return c.json({ error: "Invalid parameter" }, 400);
  }
}),
```

**バリデーションエラーの特徴**:
- ビジネスロジックエラーではなく、リクエスト形式の問題
- ルート層で処理してOK（グローバルエラーハンドラーの対象外）

## まとめ

| 層 | エラーハンドリング方法 | try-catch |
|---|---|---|
| ルート層 | なし（伝播） | ❌ 使用しない |
| アクション層 | throw new Error() | ❌ 使用しない |
| グローバルハンドラー | app.onError() | ✅ 将来実装予定 |

**重要な原則**:
1. ルートにtry-catchを置かない
2. エラーは自然に上位に伝播させる
3. 将来的にグローバルエラーハンドラーで一元管理
4. バリデーションエラーは各層で処理してOK
