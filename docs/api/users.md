# Users API

ユーザー名の登録・更新に関するAPI仕様書

## 認証方法

すべてのエンドポイントで認証が必要です。リクエストヘッダーに以下を含めてください：

```
Authorization: Bearer {jwt_token}
```

JWTトークンはSupabase Authから取得したものを使用します。

---

## エンドポイント一覧

### 1. ユーザー名登録

ユーザーの名前を新規登録します。

#### エンドポイント

```
POST /api/users/:userId/name
```

#### パスパラメータ

| パラメータ | 型   | 必須 | 説明           |
| ---------- | ---- | ---- | -------------- |
| userId     | UUID | ○    | ユーザーID     |

#### リクエストヘッダー

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### リクエストボディ

```json
{
  "name": "太郎"
}
```

| フィールド | 型     | 必須 | 制約            | 説明       |
| ---------- | ------ | ---- | --------------- | ---------- |
| name       | string | ○    | 1-255文字       | ユーザー名 |

#### レスポンス

**成功 (201 Created)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "660e8400-e29b-41d4-a716-446655440000",
  "name": "太郎",
  "createdAt": "2024-11-30T10:00:00.000Z",
  "updatedAt": "2024-11-30T10:00:00.000Z"
}
```

| フィールド | 型        | 説明                 |
| ---------- | --------- | -------------------- |
| id         | UUID      | ユーザー名レコードID |
| userId     | UUID      | ユーザーID           |
| name       | string    | ユーザー名           |
| createdAt  | timestamp | 作成日時             |
| updatedAt  | timestamp | 更新日時             |

#### エラーレスポンス

**400 Bad Request - バリデーション失敗**

```json
{
  "error": "Validation failed",
  "details": "name is required"
}
```

**401 Unauthorized - 認証失敗**

```json
{
  "error": "Unauthorized: Missing or invalid token"
}
```

**403 Forbidden - 権限なし**

```json
{
  "error": "Forbidden: You don't have permission to register this user's name"
}
```

**404 Not Found - ユーザーが存在しない**

```json
{
  "error": "Not found: User does not exist"
}
```

**409 Conflict - 既にユーザー名が登録済み**

```json
{
  "error": "Conflict: User name already exists"
}
```

**500 Internal Server Error - システムエラー**

```json
{
  "error": "Internal server error"
}
```

#### 使用例

```bash
curl -X POST http://localhost:3000/api/users/660e8400-e29b-41d4-a716-446655440000/name \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"name": "太郎"}'
```

---

### 2. ユーザー名更新

既存のユーザー名を更新します。

#### エンドポイント

```
POST /api/users/:userId/name/update
```

#### パスパラメータ

| パラメータ | 型   | 必須 | 説明       |
| ---------- | ---- | ---- | ---------- |
| userId     | UUID | ○    | ユーザーID |

#### リクエストヘッダー

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### リクエストボディ

```json
{
  "name": "次郎"
}
```

| フィールド | 型     | 必須 | 制約      | 説明       |
| ---------- | ------ | ---- | --------- | ---------- |
| name       | string | ○    | 1-255文字 | ユーザー名 |

#### レスポンス

**成功 (200 OK)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "660e8400-e29b-41d4-a716-446655440000",
  "name": "次郎",
  "updatedAt": "2024-11-30T11:00:00.000Z"
}
```

| フィールド | 型        | 説明                 |
| ---------- | --------- | -------------------- |
| id         | UUID      | ユーザー名レコードID |
| userId     | UUID      | ユーザーID           |
| name       | string    | ユーザー名           |
| updatedAt  | timestamp | 更新日時             |

#### エラーレスポンス

**400 Bad Request - バリデーション失敗**

```json
{
  "error": "Validation failed",
  "details": "name is required"
}
```

**401 Unauthorized - 認証失敗**

```json
{
  "error": "Unauthorized: Missing or invalid token"
}
```

**403 Forbidden - 権限なし**

```json
{
  "error": "Forbidden: You don't have permission to update this user's name"
}
```

**404 Not Found - ユーザーまたはユーザー名が存在しない**

```json
{
  "error": "Not found: User does not exist"
}
```

または

```json
{
  "error": "Not found: User name does not exist"
}
```

**500 Internal Server Error - システムエラー**

```json
{
  "error": "Internal server error"
}
```

#### 使用例

```bash
curl -X POST http://localhost:3000/api/users/660e8400-e29b-41d4-a716-446655440000/name/update \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"name": "次郎"}'
```

---

## エラーコード一覧

| ステータスコード | 説明                                   |
| ---------------- | -------------------------------------- |
| 200              | 成功（更新）                           |
| 201              | 成功（新規作成）                       |
| 400              | リクエストが不正（バリデーションエラー） |
| 401              | 認証失敗                               |
| 403              | 権限なし                               |
| 404              | リソースが見つからない                 |
| 409              | 既に存在する（競合エラー）             |
| 500              | サーバー内部エラー                     |

---

## 重要な仕様

### 権限チェック

- すべてのエンドポイントで、認証されたユーザー本人のデータのみ操作可能です
- 他のユーザーのデータにアクセスしようとすると `403 Forbidden` が返されます

### ユーザー名の制約

- 1ユーザーにつき1つの名前のみ保持できます
- 登録時に既に名前が存在する場合は `409 Conflict` が返されます
- 更新時に名前が存在しない場合は `404 Not Found` が返されます

### Soft Delete

- 削除されたユーザーやユーザー名は取得できません
- 削除されたユーザーに対する操作は `404 Not Found` が返されます

---

## テスト手順

### 1. JWTトークンの取得

Supabase Authでユーザー認証を行い、JWTトークンを取得してください。

### 2. ユーザー名の登録

```bash
curl -X POST http://localhost:3000/api/users/{your_user_id}/name \
  -H "Authorization: Bearer {your_jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "テスト太郎"}'
```

### 3. ユーザー名の更新

```bash
curl -X POST http://localhost:3000/api/users/{your_user_id}/name/update \
  -H "Authorization: Bearer {your_jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "テスト次郎"}'
```

### 4. エラーケースの確認

**権限なしのケース（他ユーザーのIDを指定）:**

```bash
curl -X POST http://localhost:3000/api/users/{other_user_id}/name \
  -H "Authorization: Bearer {your_jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "テスト"}'
```

期待される結果: `403 Forbidden`

**バリデーションエラー（空の名前）:**

```bash
curl -X POST http://localhost:3000/api/users/{your_user_id}/name \
  -H "Authorization: Bearer {your_jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{"name": ""}'
```

期待される結果: `400 Bad Request`
