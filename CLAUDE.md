# コミットメッセージの規約
@docs/dev/commit-message.md

# エラーハンドリング規約
@docs/dev/error-handling.md

# 環境変数の管理
@docs/dev/environment-variables.md

# データベーススキーマの管理
@docs/dev/database-schema.md

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
@docs/dev/zod-validation.md

# UIコンポーネント管理
@docs/ui/atomic-design.md

# BFFアーキテクチャ

@docs/architecture/bff-pattern.md
