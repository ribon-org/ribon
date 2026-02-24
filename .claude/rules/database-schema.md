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
