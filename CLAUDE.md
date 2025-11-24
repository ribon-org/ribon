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
