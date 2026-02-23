# UIコンポーネント管理（packages/ui）

## 基本方針

`packages/ui` は**複数のアプリケーションで再利用可能なUIコンポーネント**を管理するパッケージです。

**アトミックデザイン**と**daisyUI**の思想を取り入れた構造で設計されています。

## 役割と目的

- **再利用性**: ribon（Web）、将来のモバイルアプリ、デスクトップアプリなど、複数のアプリで共通のUIコンポーネントを使用
- **一貫性**: デザインシステムとUIの一貫性を保つ
- **保守性**: UIコンポーネントの修正が全アプリに自動的に反映される
- **階層化**: アトミックデザインにより、コンポーネントの責務が明確

## ディレクトリ構造（アトミックデザイン）

```
packages/ui/src/
├── atoms/              # 原子: 最小単位のコンポーネント
│   ├── Button.tsx      # daisyUIの btn をラップ
│   ├── Card.tsx        # daisyUIの card をラップ
│   ├── Code.tsx        # コード表示コンポーネント
│   ├── Input.tsx       # (planned) daisyUIの input をラップ
│   ├── Label.tsx       # (planned) daisyUIの label をラップ
│   ├── Alert.tsx       # (planned) daisyUIの alert をラップ
│   └── index.ts        # 一括エクスポート
│
├── molecules/          # 分子: 複数のatomsを組み合わせ (planned)
│   ├── FormField.tsx   # (planned) Label + Input の組み合わせ
│   ├── AlertMessage.tsx # (planned) Alert + アイコン/閉じるボタン
│   └── index.ts
│
├── organisms/          # 有機体: 機能的なコンポーネント
│   ├── ProfileView.tsx
│   ├── ProfileEditForm.tsx
│   ├── ProfileRegisterForm.tsx
│   └── index.ts
│
└── templates/          # テンプレート: ページレイアウト (planned)
    └── index.ts
```

## アトミックデザイン階層の定義

### Atoms（原子）- 最小単位のコンポーネント

- **daisyUIの基本コンポーネントを直接ラップ**
- 単一の責務を持つ
- 他のコンポーネントに依存しない
- 例: Button, Card, Code (実装済み) / Input, Label, Alert (planned)

**配置基準:**
- daisyUIのコンポーネントクラス（btn, input, card など）を使用
- propsでバリアントやサイズを制御
- ビジネスロジックを含まない

**例:**
```typescript
// packages/ui/src/atoms/Button.tsx
const Button = ({ variant = "primary", children, ...props }) => {
  return (
    <button className={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  );
};
```

### Molecules（分子）- 複数のatomsを組み合わせ

- **複数のAtomsを組み合わせて意味を持つ単位**
- 特定の機能を持つが、まだビジネスロジックは含まない
- 例: FormField（Label + Input）、CardHeader（Card + Title + Description）

**配置基準:**
- 2つ以上のAtomsを組み合わせる
- 再利用可能な小さな機能単位
- フォームフィールドやカードセクションなど

**例:**
```typescript
// packages/ui/src/molecules/FormField.tsx
const FormField = ({ label, error, children }) => {
  return (
    <div className="form-control">
      <Label>{label}</Label>
      {children}
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
};
```

### Organisms（有機体）- 機能的なコンポーネント

- **MoleculesとAtomsを組み合わせた複雑なコンポーネント**
- ビジネスロジックに近い
- 特定の機能を完結させる
- 例: ProfileView, ProfileEditForm, Header, Navigation

**配置基準:**
- 複数のMoleculesやAtomsを組み合わせる
- API呼び出しなどのロジックを含むことができる
- 特定のドメイン機能を表現

**例:**
```typescript
// packages/ui/src/organisms/ProfileEditForm.tsx
const ProfileEditForm = ({ userId, onSuccess }) => {
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    await fetch(`/api/users/${userId}/name`, { ... });
    onSuccess();
  };

  return (
    <Card>
      <FormField label="名前">
        <Input value={name} onChange={setName} />
      </FormField>
      <Button onClick={handleSubmit}>保存</Button>
    </Card>
  );
};
```

### Templates（テンプレート）- ページレイアウト

- **ページの骨格となるレイアウト**
- Organismsを配置する場所を定義
- 実際のコンテンツは含まない
- 例: DashboardLayout, AuthLayout

**配置基準:**
- ページ全体の構造を定義
- ヘッダー、サイドバー、フッターなどの配置
- 将来的にページレイアウトが必要になった際に使用

## コンポーネント配置の判断基準

### ✅ packages/ui に配置すべきコンポーネント

1. **汎用的なUIコンポーネント**
   - ボタン、カード、モーダル、フォーム要素など
   - 例: `Button.tsx`, `Card.tsx`, `Code.tsx`

2. **特定の機能を持つが再利用可能なコンポーネント**
   - プロフィール表示/編集フォーム
   - データ表示テーブル
   - 例: `ProfileView.tsx`, `ProfileEditForm.tsx`

3. **デザインシステムの一部**
   - テーマ、カラー、タイポグラフィなどのスタイル定義
   - レイアウトコンポーネント

### ❌ packages/ui に配置すべきでないもの

1. **アプリ固有のロジック**
   - 特定のアプリでしか使わないコンポーネント
   - ページレイアウト全体

2. **API呼び出しを含むコンポーネント（下位層）**
   - データフェッチは各アプリ側で行い、コンポーネントにはpropsで渡す
   - 例外: Organisms以上ではAPI呼び出しを含むことができる

3. **ルーティング固有の処理**
   - Next.jsのApp Routerなど、フレームワーク固有の機能

## 命名規則

### ファイル名

- **パスカルケース**（PascalCase）を使用
- 大文字から始めるキャメルケース
- 例: `ProfileView.tsx`, `ProfileEditForm.tsx`, `UserAvatar.tsx`

### コンポーネント名（export）

- **パスカルケース**（PascalCase）を使用
- ファイル名と一致させる
- 例: `ProfileView`, `ProfileEditForm`, `UserAvatar`

### 関数の書き方

- **アロー関数**を使用する
- 通常の関数宣言（`function`）は使用しない

### 例

```typescript
// ファイル名: ProfileView.tsx

// ✅ 推奨（アロー関数）
const ProfileView = ({ ... }) => {
  // ...
};

export default ProfileView;
```

```typescript
// ❌ 避けるべき（通常の関数宣言）
export default function ProfileView({ ... }) {
  // ...
}
```

## コンポーネント設計の原則

### 1. Presentational Component として設計

コンポーネントは**見た目の責務のみ**を持ち、ビジネスロジックは含めない。

```typescript
// ✅ 良い例
interface ProfileViewProps {
  profile: {
    name: string | null;
    createdAt: string;
  };
  onEdit: () => void;
}

const ProfileView = ({ profile, onEdit }: ProfileViewProps) => {
  return (
    <div className="card">
      <h2>{profile.name}</h2>
      <button onClick={onEdit}>編集</button>
    </div>
  );
};

export default ProfileView;
```

```typescript
// ❌ 悪い例（API呼び出しを含む）
const ProfileView = ({ userId }: { userId: string }) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // ❌ コンポーネント内でAPI呼び出し
    fetch(`/api/users/${userId}`).then(/* ... */);
  }, [userId]);

  return <div>...</div>;
};

export default ProfileView;
```

### 2. propsで制御を受け取る

状態管理やイベントハンドラは親コンポーネントから受け取る。

```typescript
// ✅ 良い例
interface FormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const Form = ({ value, onChange, onSubmit, isSubmitting }: FormProps) => {
  return (
    <form onSubmit={onSubmit}>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
      <button disabled={isSubmitting}>送信</button>
    </form>
  );
};

export default Form;
```

### 3. "use client" ディレクティブの使用

Next.jsなどでクライアント側の機能（useState、useEffectなど）を使う場合は、ファイルの先頭に`"use client"`を追加。

```typescript
"use client";

import { useState } from "react";

const InteractiveComponent = () => {
  const [count, setCount] = useState(0);
  // ...
};

export default InteractiveComponent;
```

## エクスポート方法

`packages/ui/package.json` の `exports` フィールドで、アトミックデザインの各階層をエクスポート：

```json
{
  "exports": {
    "./atoms": "./src/atoms/index.ts",
    "./atoms/*": "./src/atoms/*.tsx",
    "./molecules": "./src/molecules/index.ts",
    "./molecules/*": "./src/molecules/*.tsx",
    "./organisms": "./src/organisms/index.ts",
    "./organisms/*": "./src/organisms/*.tsx",
    "./templates": "./src/templates/index.ts",
    "./templates/*": "./src/templates/*.tsx"
  }
}
```

### 使用例

**個別インポート（推奨）:**
```typescript
// Atoms
import Button from "@repo/ui/atoms/Button";
import Input from "@repo/ui/atoms/Input";

// Molecules
import FormField from "@repo/ui/molecules/FormField";

// Organisms
import ProfileView from "@repo/ui/organisms/ProfileView";
import ProfileEditForm from "@repo/ui/organisms/ProfileEditForm";
```

**一括インポート:**
```typescript
import { Button, Input, Card } from "@repo/ui/atoms";
import { FormField } from "@repo/ui/molecules";
import { ProfileView, ProfileEditForm } from "@repo/ui/organisms";
```

## 実装例

### 汎用ボタンコンポーネント（Atom）

```typescript
// packages/ui/src/atoms/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}

const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled = false
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
};

export default Button;
```

### プロフィールビューコンポーネント（Organism）

```typescript
// packages/ui/src/organisms/ProfileView.tsx
interface ProfileViewProps {
  profile: {
    name: string | null;
    createdAt: string;
    updatedAt: string;
  };
  onEdit: () => void;
}

const ProfileView = ({ profile, onEdit }: ProfileViewProps) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">{profile.name}</h2>
        <p>作成日: {new Date(profile.createdAt).toLocaleString("ja-JP")}</p>
        <button onClick={onEdit} className="btn btn-primary">
          編集
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
```

## まとめ

### 構造の原則

- ✅ **アトミックデザイン**でコンポーネントを階層化（atoms → molecules → organisms → templates）
- ✅ **daisyUI**の思想を取り入れた設計（セマンティックなクラス名、テーマサポート）
- ✅ **パスカルケース**でファイル名を命名（例: `ProfileView.tsx`）
- ✅ **アロー関数**でコンポーネントを定義
- ✅ **index.ts**で各階層のコンポーネントを一括エクスポート

### 配置の原則

- ✅ **Atoms**: daisyUIの基本コンポーネントをラップ（Button, Card, Code が実装済み。Input, Label, Alert は planned）
- ✅ **Molecules**: 複数のAtomsを組み合わせ（FormField, CardHeader など）
- ✅ **Organisms**: 機能的なコンポーネント（ProfileView, ProfileEditForm など）
- ✅ **Templates**: ページレイアウト（将来用）
- ❌ **API呼び出しはOrganisms以上で許可**、Atoms/Moleculesには含めない
- ❌ **アプリ固有の処理**を下位層（Atoms/Molecules）に含めない

### インポートの原則

```typescript
// ✅ 推奨: 階層を明示してインポート
import Button from "@repo/ui/atoms/Button";
import ProfileView from "@repo/ui/organisms/ProfileView";

// ✅ OK: index経由で一括インポート
import { Button, Input } from "@repo/ui/atoms";

// ❌ 避ける: 直接パスでインポート
import Button from "@repo/ui/src/atoms/Button";
```

この原則に従うことで、複数のアプリケーション（Web、モバイル、デスクトップ）で同じUIコンポーネントを再利用でき、一貫したデザインと保守性の高いコードベースを実現できます。また、アトミックデザインにより、コンポーネントの責務が明確になり、開発効率が向上します。
