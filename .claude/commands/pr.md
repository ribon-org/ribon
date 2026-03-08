---
description: 現在のブランチ名からJiraチケット番号を取得し、Jiraからタスク情報を取得してPRを作成します。
allowed-tools: Bash(git:*), Bash(gh:*), mcp__atlassian__getJiraIssue, Read
model: haiku
---

現在のブランチ名からJiraチケット番号を取得し、Jiraからタスク情報を取得してPRを作成してください。

対象リポジトリ: https://github.com/nikawa2161/ribon
対象Jira: https://nikawa2161t.atlassian.net
Jira cloudId: cb42fdf4-ddaf-4561-8ab1-21ffc4468783

## 実行手順

### 1. ブランチ名とチケット番号の取得

`git branch --show-current` で現在のブランチ名を取得し、チケット番号を抽出する。

**チケット番号の抽出ルール:**
- ブランチ名から `RIBBON-数字` のパターンを探す
- レガシー形式 `RIBON-数字` も対応し、`RIBBON-数字` に正規化する
- 例:
  - `feature/RIBBON-35` → `RIBBON-35`
  - `feature/RIBBON-35-some-description` → `RIBBON-35`
  - `feature/RIBON-13` → `RIBBON-13`（正規化）
- **パターンが見つからない場合**: ユーザーにチケット番号の入力を求める

### 2. Jiraチケット情報の取得

`mcp__atlassian__getJiraIssue` を使用してチケット情報を取得する。

- **cloudId**: `cb42fdf4-ddaf-4561-8ab1-21ffc4468783`
- **issueIdOrKey**: 抽出したチケット番号（例: `RIBBON-35`）

取得成功時:
- PRタイトル: `{Jiraのsummary} (RIBBON-XX)`

取得失敗時（フォールバック）:
- `git log main..HEAD --oneline` からコミット履歴を確認
- PRタイトル: `[主な変更内容の要約] (RIBBON-XX)`

### 3. リモートへのプッシュ

`git push -u origin HEAD` で最新の変更をリモートリポジトリにプッシュ。

### 4. PRテンプレートの準備

`.github/PULL_REQUEST_TEMPLATE.md` をReadツールで読み込み、以下の内容で埋める:

- **チケットへのリンク**: `https://nikawa2161t.atlassian.net/browse/{チケット番号}`
- **やったこと**: `git log main..HEAD --format="%s"` から取得したコミットメッセージ（絵文字を除いた説明部分）を箇条書き
- **確認手順**: 変更されたファイルタイプに基づいて推奨される確認手順を提案
- **その他**: 必要に応じて特記事項を記載

### 5. PRの作成

`gh pr create` コマンドを使用してPRを作成:
- **ベースブランチ**: `main`
- **タイトル**: Jiraタスクのタイトル、またはフォールバックで生成したタイトル
- **本文**: テンプレートに基づいて生成した内容（HEREDOCを使用）
- **Open**で作成（Draftではない）

```bash
gh pr create --title "タイトル" --body "$(cat <<'EOF'
[PR本文]
EOF
)" --base main
```

### 6. PR URLの表示

作成されたPR URLをユーザーに表示。

## エラーハンドリング

- **ブランチ名にチケット番号がない場合**: ユーザーにチケット番号の入力を求める
- **Jiraチケットが取得できない場合**: コミット履歴からPRタイトルを生成して続行
- **プッシュが失敗した場合**: エラーを表示し、ユーザーに対処を求める
- **PRが既に存在する場合**: 既存PRのURLを表示
- **mainと差分がない場合**: その旨を伝えてPR作成を中止

## 注意事項

- PRは必ずOpenで作成（Draftではない）
- コミットメッセージは絵文字を除いた部分のみを使用
- PR本文の最後にGitユーザー名のメンションは不要
- `gh pr create` のHEREDOCでは `'EOF'` とシングルクォートで囲む
