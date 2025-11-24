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
