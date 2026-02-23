---
description: 現在のブランチ名からJiraチケット番号を取得し、Jiraからタスク情報を取得してPRを作成します。
allowed-tools: Bash(git:*), Bash(gh:*)
model: haiku
---

現在のブランチ名からJiraチケット番号を取得し、Jiraからタスク情報を取得してPRを作成してください。

対象リポジトリ: https://github.com/nikawa2161/ribon
対象Jira: https://nikawa2161t.atlassian.net

## 実行手順

### 1. ブランチとチケット番号の確認

以下を並列実行してください:
- `git branch --show-current` で現在のブランチ名を確認
- ブランチ名からJiraチケット番号を抽出（例: `feature/RIBBON-898` → `RIBBON-898`）

### 2. Jiraチケット情報の取得

**注意**: Atlassian MCPが利用できない場合、この手順はスキップしてください。
- Jiraチケット情報が取得できない場合は、コミット履歴から適切なPRタイトルを生成
- PRタイトル形式: `[主な変更内容] (RIBBON-XX)`

### 3. リモートへのプッシュ

`git push` で最新の変更をリモートリポジトリにプッシュ

### 4. PRテンプレートの準備

`.github/PULL_REQUEST_TEMPLATE.md` を読み込み、以下の内容で埋める:

- **チケットへのリンク**: `https://nikawa2161t.atlassian.net/browse/{チケット番号}`
- **やったこと**: `git log main..HEAD` から取得したコミットメッセージ（絵文字を除いた説明部分）を箇条書き
- **確認手順**: 変更されたファイルタイプに基づいて推奨される確認手順を提案
- **その他**: 必要に応じて特記事項を記載

### 5. PRの作成

`gh pr create` コマンドを使用してPRを作成:
- **リポジトリ**: `nikawa2161/ribon`
- **ベースブランチ**: `main`
- **タイトル**: Jiraタスクのタイトル、または生成したタイトル
- **本文**: テンプレートに基づいて生成した内容（HEREDOCを使用）
- **Draft**: デフォルト（Openで作成）

```bash
gh pr create --title "タイトル" --body "$(cat <<'EOF'
[PR本文]
EOF
)" --base main
```

### 6. PR URLの表示

作成されたPR URLをユーザーに表示

## エラーハンドリング

- **ブランチ名にチケット番号がない場合**: 手動でチケット番号の入力を求める
- **Jiraチケットが取得できない場合**: コミット履歴からPRタイトルを生成して続行
- **プッシュが必要な場合**: プッシュを実行してから再試行
- **PRが既に存在する場合**: 既存PRのURLを表示
- **GitHub MCPが利用できない場合**: `gh pr create` コマンドを使用

## 注意事項

- PRは必ずOpenで作成（Draftではない）
- コミットメッセージは絵文字を除いた部分のみを使用
- PR本文の最後にGitユーザー名のメンションは不要
- `git log main..HEAD --format="%B"` で全コミットメッセージ（詳細含む）を取得
- `gh pr create` のHEREDOCでは `'EOF'` とシングルクォートで囲む
