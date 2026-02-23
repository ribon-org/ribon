# [機能名]

> **Jira**: [RIBBON-XXX](https://nikawa2161t.atlassian.net/browse/RIBBON-XXX)
> **Status**: Draft | Ready | In Progress | Done

---

## 概要

<!-- この機能が解決する問題と、実現することを1〜3文で説明 -->

---

## ユーザーストーリー

```
As a [ユーザータイプ],
I want to [したいこと],
So that [得られる価値].
```

---

## 受け入れ条件

<!-- テストケースの基準になる。具体的かつ検証可能な形で記述 -->

- [ ] [条件1]
- [ ] [条件2]
- [ ] [条件3]

---

## ドメインモデル / 型定義

<!-- 主要なエンティティ・型を記述。実装前の合意に使う -->

```typescript
// 例
type ExampleEntity = {
  id: string;
  // ...
};
```

---

## API仕様

<!-- 変更・追加するAPIエンドポイントがある場合のみ記述 -->

### `GET /api/example`

**Request**
```
params: { id: string }
```

**Response**
```typescript
{ data: ExampleEntity }
```

---

## 除外スコープ

<!-- 「やらないこと」を明示することで実装範囲を明確にする -->

- [除外1]
- [除外2]
