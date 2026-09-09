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

## 2. コンポーネントディレクトリ設計・命名規則（ドメイン・アトミック統合方式）

開発時の見通しとアトミックデザインの階層（立場）を一目で明確にするため、**「業務ドメイン（機能）」ディレクトリ内に配置する場合もアトミックプレフィックス（`Organisms...` 等）を付与**します。
Nuxt 3 のコンポーネント自動プレフィックス機能（`nuxt.config.ts`）により、テンプレート上は `<ToolOrganismsVoltageInput>` のようにドメイン名とアトミック階層が明示されます。

### ディレクトリ構造とタグ名の対応関係

```
app/components/
├── AtomsButton.vue                  # ➔ <AtomsButton>
├── MoleculesFormGroup.vue           # ➔ <MoleculesFormGroup>
├── OrganismsHeader.vue              # ➔ <OrganismsHeader>
├── OrganismsModal.vue               # ➔ <OrganismsModal>
│
├── tool/                            # 電卓・計算ツール専用
│   ├── OrganismsVoltageInput.vue    # ➔ <ToolOrganismsVoltageInput>
│   ├── OrganismsVoltageResult.vue   # ➔ <ToolOrganismsVoltageResult>
│   ├── OrganismsConduitInput.vue    # ➔ <ToolOrganismsConduitInput>
│   ├── OrganismsRackInput.vue       # ➔ <ToolOrganismsRackInput>
│   ├── OrganismsRackResult.vue      # ➔ <ToolOrganismsRackResult>
│   └── OrganismsHistoryCard.vue     # ➔ <ToolOrganismsHistoryCard>
│
├── portal/                          # 送電ポータル・現場管理専用
│   ├── OrganismsPhase1Table.vue     # ➔ <PortalOrganismsPhase1Table>
│   └── OrganismsSiteSettingsModal.vue# ➔ <PortalOrganismsSiteSettingsModal>
│
└── database/                        # 規格データベース専用
    ├── OrganismsDbLayout.vue        # ➔ <DbOrganismsDbLayout>
    └── MoleculesDbMenuTile.vue      # ➔ <DbMoleculesDbMenuTile>
```

### なぜこの設計にするのか？
1. **アトミック階層の明確化**: ファイル名およびタグ名を見るだけで、そのコンポーネントがアトミックデザインのどの階層（Atoms / Molecules / Organisms）に属しているかが瞬時に判別できる。
2. **保守性の向上**: 大規模な開発やリファクタリング時でも、コンポーネントの責務（状態やビジネスロジックを持ってよいか否か）をタグ名から直感的に把握できる。
3. **ドメイン隔離**: 特定画面専用の部品と共通部品が物理的に分離されつつ、アトミック規約がブレずに統一される。

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
Atomsを2〜3個組み合わせた、単一機能の最小UIブロック。

- **命名規則:** `Molecules{ComponentName}.vue` （例: `MoleculesInputGroup.vue`, `MoleculesFormGroup.vue`, `MoleculesKanaFilter.vue`）
- **判定基準:** **他のMoleculesを内包しておらず、純粋にAtomsのみを組み合わせた最小単位か？**
- **ルール:**
  - 汎用性を保つ（API通信やPiniaは禁止のDumbコンポーネント）。
  - **他のMoleculesを内包してはならない**（Moleculesを内包・合成した段階で `Organisms` に分類される）。
  - **過剰なスロット化の禁止（YAGNI原則）:**
    - 差し替える予定のない固定パーツ（アイコン、タイトル、説明文、区切り線等）を安易に `<slot name="...">` で囲って過剰設計しない。
    - 基本は Props による直接描画とし、外部から自由なコンテンツを差し込む必要がある場合のみ、シンプルなデフォルトスロット `<slot />` を開放する。
- **CSS方針:**
  - Tailwind が主役。Atoms同士の余白（`gap`）や配置（`flex`, `grid`）をTailwindクラスで指定する。

---

### 2.3. `Organisms...` （有機体）
MoleculesやAtomsを組み合わせて構築する、画面の独立した機能セクション。

- **命名規則:** `Organisms{ComponentName}.vue` （例: `OrganismsHeader.vue`, `OrganismsFilterPanel.vue`, `OrganismsPhase1Table.vue`, `OrganismsSiteSettingsModal.vue`）
- **判定基準:** 以下のいずれかに該当するか？
  1. **他のMoleculesを複数内包・合成している**（例: `OrganismsFilterPanel` ＝ Panel + SectionHeader + 複数のFormGroup）
  2. **画面の独立した機能セクション（ヘッダー、検索サイドバー、モーダル、複雑なデータテーブル等）を構成している**
  3. アプリ固有のデータ型を扱っている、またはAPIやPiniaと連携している
- **ルール:**
  - AtomsとMoleculesを組み合わせて構築する。
  - ビジネスロジック（データ取得・保存）や状態を持ってもよい。
- **CSS方針:**
  - 内部のレイアウト調整（セクションの配置や余白）をTailwindで行う。

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

開発中、コンポーネントの分類に迷った際（特に Molecules と Organisms の境界）は、以下の判定フローに従ってください。

> **STEP 1: 構成要素のチェック**
> - **Q. 他の「Molecules」を内包しているか？ または画面の独立セクション（検索サイドバー、ヘッダー、モーダル等）を形成しているか？**
>   - **YES ➔ `Organisms...`**（高分子・セクション）
>
> **STEP 2: データのチェック**
> - **Q. アプリ専用のデータ型（User型等）やAPI通信・Piniaが混ざっているか？**
>   - **YES ➔ `Organisms...`**（アプリ固有機能部品）
>
> **STEP 3: 最小単位のチェック**
> - **上記がすべて NO で、純粋に Atoms のみを組み合わせた最小UIブロックか？**
>   - **YES ➔ `Molecules...`**（純粋な分子部品）

この基準を厳守することで、直感と構造が完全に一致し、破綻のない美しいアトミックデザインを維持できます。

---

## 4. テーブル設計・アライメント（align）の原則

データテーブル（`MoleculesTable`）のカラム定義（`TableColumn`）におけるテキスト整列（`align`）は、データの性質・型に応じて以下の3原則に従って統一します。

| 揃え方 (`align`) | 対象データ型 | 具体例 | 理由 |
| :--- | :--- | :--- | :--- |
| **左揃え (`left`)**<br>※未指定デフォルト | テキスト・名称・長文 | ケーブル種別、サイズ名、回路名称、盤名、備考、氏名、規格 | 文章・文字列は左から読むため、左端が揃っていると視線移動が最小になり一覧性が高まる |
| **右揃え (`right`)** | 数値・計算結果・物理量 | 断面積 ($mm^2$)、外径/内径 ($mm$)、許容電流 ($A$)、質量 ($kg$)、トルク ($N\cdot m$) | 桁数・単位の縦位置が揃うため、数値の大小比較が直感的に行える |
| **中央揃え (`center`)** | 固定長識別子・状態・日付・操作 | 回路番号、呼び径、確認チェック、合否バッジ、削除/編集ボタン、測定日時 | セル幅の中央に配置されることで、余白のバランスが取れて視覚的に安定する |

- **ヘッダー連動**: カラム定義に `align` を指定することで、見出し（`<th>`）とデータセル（`<td>`）が自動で同じ揃えになります。
- **テンプレート簡素化**: カラム定義で `align: 'center'` などを指定している場合、テンプレート側で不要な `<div class="flex justify-center">` などのセンタリング用ラッパーを書かず、テーブルの標準配置に委ねることを推奨します。

