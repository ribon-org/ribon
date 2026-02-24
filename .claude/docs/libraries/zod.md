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
