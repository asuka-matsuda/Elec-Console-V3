# コーディング規約: コメント・コメントアウト運用基準（ベストプラクティス）

本ドキュメントは、本プロジェクトにおけるソースコードのコメントおよびコメントアウトに関する統一基準を定めたものです。
ESLint カスタムルール（`eslint-rules/`）と連携し、機械的に品質と一貫性を担保します。

---

## 1. コメントアウトされたコード（Dead Code）の完全禁止

### 原則
- **不要になったコードをコメントアウト（`// const ...`, `// if (...)` 等）の形でコードベースに残すことを固く禁止します。**
- **過去の実装への未練や言及（例: `// The old code did...`, `// 以前は〜〜だった`）も禁止します。**

### 理由
- Git 等のバージョン管理システムが過去の変更履歴をすべて記録しています。
- コメントアウトされたコードは「なぜ残されているのか」「現在も動作するのか」「いつ消していいのか」が不明確になり、開発者の認知負荷を高め、リファクタリングを阻害します。

### ESLint ルール
- `local/no-commented-code`（`eslint-rules/no-commented-code.mjs`）によって自動検知・ブロックされます。

---

## 2. Vue SFC テンプレート内コメント（HTML Comments）の禁止

### 原則
- **Vue SFC の `<template>` タグ内での HTML コメント（`<!-- ... -->`）の記述を禁止します。**

### 理由
- HTML コメントはブラウザの DOM ツリーに無駄なコメントノードとしてレンダリングされる可能性があり、バンドルサイズや SSR / ハイドレーション時のオーバーヘッドとなります。
- 設計意図や仕様の説明は、`<script setup>` 側の JSDoc / TSDoc またはインラインコメントとして記述してください。

### ESLint ルール
- `local/no-template-comments`（`eslint-rules/no-template-comments.mjs`）によって自動検知・ブロックされます。

---

## 3. コメントの目的: What ではなく「Why（背景・意図・根拠）」を書く

### 原則
- コードを読めば自明なこと（What）は書かず、**「なぜその実装を選択したのか」「業務制約」「電気規格（内線規程・JIS）の計算根拠」「他端末との競合回避（楽観ロック）」などの背景・意図（Why）** を記述します。
- 単なるファイル名だけのコメント（`// foo.ts`）や、関数名・変数名をそのまま日本語にしただけのノイズコメント（`// idを取得`）は禁止します。

```typescript
// ❌ 悪い例（コードの重複・ノイズ）
// idを取得する
const id = user.id

// ⭕ 良い例（Why や仕様背景が明確）
// master アカウント（松田飛鳥氏）の削除・一般作業者への降格はシステム保護のため禁止
if (targetUser.loginId === 'master') {
  throw createForbiddenError('master アカウントは変更できません')
}
```

---

## 4. ファイルヘッダー JSDoc の統一配置

### 原則
すべてのモジュール・コンポーネント・ユーティリティ・API・ミドルウェア・定数ファイルの先頭には、ファイルの責務と目的を明記した **JSDoc コメント（`/** ... */`）** を配置します。

### 配置場所の厳格ルール
- **Vue SFC (`.vue`):** `<script setup>` タグの **直後（1行目）** に配置する（`<script setup>` のない SFC は禁止）。
- **TypeScript (`.ts`):** `import` 文より前、**ファイルの 1 行目** に配置する。

### 統一テンプレート

#### ① Vue コンポーネント (`.vue`)
コンポーネント名、アトミックデザインまたは機能カテゴリ（`[Atoms]`, `[Molecules]`, `[Portal Molecules]` 等）、および概要を記述します。
```vue
<script setup lang="ts">
/**
 * Button
 * [Atoms] 汎用的なボタン・リンクボタンコンポーネント（最小パーツ）
 * - to/href 指定時は NuxtLink、未指定時は button をポリモーフィックに描画
 */
```

#### ② Composable (`app/composables/`)
タイトル行と `@description` タグで構成します。
```typescript
/**
 * パスワード変更 Composable
 *
 * @description パスワードの入力状態、バリデーション、および変更API呼び出しのフローを管理します。
 */
```

#### ③ サーバー API (`server/api/`)
エンドポイント名、HTTP メソッドとパス、`@description`、`@permission` を記述します。
```typescript
/**
 * ログイン認証 API
 * POST /api/auth/login
 *
 * @description ユーザーID・パスワードによる認証を行い、セッショントークンを発行します。
 * @permission パブリック（未認証可）
 */
```

### ESLint ルール
- `local/require-file-jsdoc`（`eslint-rules/require-file-jsdoc.mjs`）によって自動検知・強制されます。

---

## 5. 言語とフォーマットの統一

### 原則
- **言語:** プロジェクトのドメイン用語・仕様が日本語ベースであるため、コメントは原則として **日本語** に統一します（例外: `@param`, `@returns`, `// eslint-disable` などの標準ディレクティブのみ英語）。
- **記法:**
  - インラインコメントは必ずスラッシュの後に半角スペースを置く（`// コメント`）。
  - `@stylistic/spaced-comment` により機械的に検証されます。

---

## 6. サーフェス部品の用語規約: Card / Box の完全廃止と Panel への統一

### 原則
- 本プロジェクトの基本サーフェス・コンテナ部品は **`<Panel>`**（およびその派生パネルコンポーネント）のみを唯一の正とします。
- **「Card（カード）」および「Box（ボックス）」という呼称・命名は完全に禁止**します。
  - コンポーネントファイル名: `CardSoudenOverall.vue` ➔ `PanelSoudenOverall.vue`、`ResultBox.vue` ➔ `ResultPanel.vue`
  - CSSクラス名: `.conflict-card` ➔ `.conflict-panel`、`result-box` ➔ `result-panel`
  - ViewModel / Presenter: `boxStatus` ➔ `panelStatus`、`RackTierCardViewModel` ➔ `RackTierPanelViewModel`
  - JSDoc / コメント: 「〜カード」「〜ボックス」などの表現は使用せず、「〜パネル」に統一します（※チェックボックス、セレクトボックス等の標準フォーム名、CSSボックスモデル、電気工事用語のプルボックス等を除く）。

### ESLint ルール
- `local/no-card-or-box-naming`（`eslint-rules/no-card-or-box-naming.mjs`）によって自動検知・強制されます。

