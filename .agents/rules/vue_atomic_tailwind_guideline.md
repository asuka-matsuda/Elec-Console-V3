# コーディング規約: Vue × Tailwind CSS × アトミックデザイン

本ドキュメントは、個人開発プロジェクトにおけるフロントエンドのコーディング規約です。
Vueのコンポーネント指向、Tailwind CSSの開発体験、そしてアトミックデザイン（5階層）の美しい構造を組み合わせたアーキテクチャを採用しています。

---

## 1. CSS設計方針（ハイブリッド・アプローチ）

本プロジェクトでは、「Tailwind CSS」と「Vue Scoped CSS」を適材適所で使い分けるハイブリッド方式を採用します。
Tailwind CSSは**レイアウト・配置・余白・寸法に関するものだけ**を担当します。

### 役割分担
- **Tailwind CSS（レイアウト専用・グローバルユーティリティ）**
  - **対象:** レイアウト、配置、余白、寸法、整列など「UIの骨格」に関するもの**のみ**。
  - **目的:** HTMLを見るだけでUIの骨格・レイアウト（配置・余白）を直感的に把握できるようにする。
  - **使用例:** `display (flex/grid)`, `margin`, `padding`, `width`, `height`, `gap`, `position`, `text-align`
  - **※ 装飾（カラー、シャドウ、グラデーション等）はTailwindで行わず、Scoped CSSに委ねる。**
- **Vue Scoped CSS（装飾・状態カプセル化）**
  - **対象:** 複雑な装飾、境界線、カラー、特殊な状態、長いCSSプロパティが必要なもの。
  - **目的:** スタイルをコンポーネント内にカプセル化し、Tailwindクラスが肥大化するのを防ぐ。
  - **使用例:** `color`, `border` (color-mix等), `background` (グラデーション等), `box-shadow`, `transition`, `animation`, 擬似要素 (`::before`/`::after`)

---

## 2. コンポーネント命名規則・判定ルール（プレフィックス方式）

コンポーネントのディレクトリ階層化（サブディレクトリ分割）は行わず、**`app/components/` 直下にフラット配置**します。
アトミックデザインの階層分類は、従来の `App...` プレフィックスから **`Atoms...` / `Molecules...` / `Organisms...` / `Templates...` などのプレフィックスへの変更**によって表現します。

```
app/components/
├── AtomsBadge.vue          # [Atoms] 最小パーツ
├── AtomsButton.vue         # [Atoms] 最小パーツ
├── MoleculesFormGroup.vue  # [Molecules] Atomsの組み合わせ
├── OrganismsHeader.vue     # [Organisms] データ・APIと連携するセクション
...
```

---

### 2.1. `Atoms...` （原子）
これ以上分解できない、単一のUIパーツ。

- **命名規則:** `Atoms{ComponentName}.vue` （例: `AtomsButton.vue`, `AtomsBadge.vue`, `AtomsInput.vue`, `AtomsIcon.vue`）
- **判定基準:** 中に他の自作コンポーネントを含んでいないか？（アイコンは例外）
- **ルール:**
  - 特定のデータ（User型など）に依存せず、どこでも使えるようにする。
  - Props, Emits, Slot のみを使用。API通信や状態管理（Pinia）は**絶対禁止**。
- **CSS方針:**
  - Scoped CSS が主役。境界線、エフェクト、フォント装飾、アニメーションなどの複雑な装飾はここに閉じ込める。
  - レイアウト（`inline-flex`, `items-center`, `padding` など）のみ Tailwind クラスで指定。

---

### 2.2. `Molecules...` （分子）
Atomsを2〜3個組み合わせた、純粋なUIブロック。

- **命名規則:** `Molecules{ComponentName}.vue` （例: `MoleculesSearchForm.vue`, `MoleculesFormGroup.vue`, `MoleculesKanaFilter.vue`）
- **判定基準:** 複数のAtomsを組み合わせているが、特定の機能・データに依存していないか？
- **ルール:**
  - 汎用性を保つ（API通信やPiniaは禁止のDumbコンポーネント）。
  - **スロットの積極活用（バケツリレー・Props爆発の防止）:**
    - Moleculesの主責務は「Atoms同士のレイアウト・配置・余白」を規定すること。
    - 内部に組み込むAtoms（Badge, Button, Divider, Icon等）の詳細設定（色、バリアント等）をすべてMoleculesのPropsとして受け取って中継（バケツリレー）しない。
    - 基本は手軽なPropsでデフォルト描画（例: `title`, `icon`）しつつ、スロット（例: `<slot name="actions" />`, `<slot name="badge" />`, `<slot name="divider"><AtomsDivider /></slot>`）を開放して親からAtomsを直接注入・カスタマイズできるハイブリッド設計とする。
- **CSS方針:**
  - Tailwind が主役。Atoms同士の余白（`gap`）や配置（`flex`, `grid`）をTailwindクラスで指定する。

---

### 2.3. `Organisms...` （有機体）
具体的な機能やデータを持った、独立したセクション。

- **命名規則:** `Organisms{ComponentName}.vue` （例: `OrganismsHeader.vue`, `OrganismsPhase1Table.vue`, `OrganismsSiteSettingsModal.vue`）
- **判定基準:** アプリ固有のデータ（User型など）を扱っている、またはAPIやPiniaと繋がっているか？
- **ルール:**
  - AtomsとMoleculesを組み合わせて構築する。
  - ここからビジネスロジック（データの取得・保存）を持ってよい。個人開発ではOrganismsが直接APIを叩く設計を推奨。
- **CSS方針:**
  - 内部のレイアウト調整（セクションの配置や余白）をTailwindで行うのみ。

---

### 2.4. `Templates...` （テンプレート）
ページの骨組み（レイアウト・ワイヤーフレーム）。

- **命名規則:** `Templates{ComponentName}.vue` （または `layouts/*.vue`）
- **判定基準:** ヘッダーやサイドバーの配置のみを定義し、メインコンテンツは `<slot />` で外から注入するか？
- **ルール:**
  - Nuxt等の `layouts/` ディレクトリと同等の扱いとし、全画面共通のガワを作る。

---

### 2.5. `pages/` （ページ）
URL（ルーティング）と1対1で紐づく画面そのもの。

- **配置場所:** `app/pages/` 配下
- **判定基準:** Vue RouterでURLが設定されているか？
- **ルール:**
  - 細かいAtomsを直接配置せず、Templatesの中にOrganismsを配置して画面を完成させる。

---

## 3. 迷った時の「一発判定」テスト

開発中、コンポーネントの分類に迷った際（特に Molecules と Organisms の境界）は、以下のテストを実施してください。

> **Q. そのコンポーネントに「User」や「Article」など、アプリ専用のデータ型やAPI処理が混ざっているか？**
>
> - **NO** ➔ `Molecules...` （純粋なUI部品）
> - **YES** ➔ `Organisms...` （アプリ固有の機能部品）

この基準を厳守することで、ディレクトリを細分化しなくても、ファイル名のプレフィックスだけでコンポーネントの責務と階層がひと目で判別でき、一貫したプロジェクト構造を維持できます。
