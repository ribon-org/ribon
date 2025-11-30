---
description: 現在のブランチ名からJiraチケット番号を取得し、Jiraからタスク情報を取得してPRを作成します。
allowed-tools: Bash(git:*), Bash(gh:*)
model: haiku
---

現在のブランチ名からJiraチケット番号を取得し、Jiraからタスク情報を取得してPRを作成してください。

対象リポジトリ: https://github.com/ribon-org/ribon
対象Jira: https://nikawa2161t.atlassian.net

## 実行手順

### 1. ブランチとチケット番号の確認

以下を並列実行してください:
- `git branch --show-current` で現在のブランチ名を確認
- ブランチ名からJiraチケット番号を抽出（例: `feature/RIBBON-898` → `RIBBON-898`）

### 2. Jiraチケット情報の取得

Atlassian MCPを使用してチケット情報を取得:
- `mcp__atlassian__getJiraIssue` でチケット詳細を取得
- タスクのタイトルをPRタイトルとして使用

### 3. リモートへのプッシュ

`git push` で最新の変更をリモートリポジトリにプッシュ

### 4. PRテンプレートの準備

`.github/PULL_REQUEST_TEMPLATE.md` を読み込み、以下の内容で埋める:

- **チケットへのリンク**: `https://nikawa2161t.atlassian.net/browse/{チケット番号}`
- **やったこと**: `git log main..HEAD` から取得したコミットメッセージ（絵文字を除いた説明部分）を箇条書き
- **確認手順**: 変更されたファイルタイプに基づいて推奨される確認手順を提案
- **その他**: 必要に応じて特記事項を記載

### 5. PRの作成

GitHub MCPを使用してPRを作成:
- `mcp__github__create_pull_request` を使用
- **リポジトリ**: `ribon-org/ribon`
- **ベースブランチ**: `main`
- **タイトル**: Jiraタスクのタイトル
- **本文**: テンプレートに基づいて生成した内容
- **Draft**: `false` (Openで作成)

### 6. PR URLの表示

作成されたPR URLをユーザーに表示

## エラーハンドリング

- **ブランチ名にチケット番号がない場合**: 手動でチケット番号の入力を求める
- **Jiraチケットが見つからない場合**: チケット番号の再確認を促す
- **プッシュが必要な場合**: プッシュを実行してから再試行
- **PRが既に存在する場合**: 既存PRのURLを表示

## 注意事項

- PRは必ずOpenで作成（Draftではない）
- コミットメッセージは絵文字を除いた部分のみを使用
- PR本文の最後にGitユーザー名のメンションは不要
