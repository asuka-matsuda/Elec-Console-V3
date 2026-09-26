# コーディング規約: Vue × Tailwind CSS × アトミックデザイン

本ドキュメントは、個人開発プロジェクトにおけるフロントエンドのコーディング規約です。
Vueのコンポーネント指向、Tailwind CSSの開発体験、そしてアトミックデザイン（5階層）の美しい構造を組み合わせたアーキテクチャを採用しています。

---

## 1. CSS設計方針（ハイブリッド・アプローチ）

本プロジェクトでは、「Tailwind CSS」と「Vue Scoped CSS」を適材適所で使い分けるハイブリッド方式を採用します。
Tailwind CSSは**レイアウト・配置・余白・寸法に関するものだけ**を担当します。

### 役割分担
- **Tailwind CSS（レイアウト専用・グローバルユーティリティ）**
  - **対象:** レイアウト、配置、画面グリッド余白、寸法、整列など「UIの骨格」に関するもの**のみ**。
  - **目的:** HTMLを見るだけでUIの骨格・レイアウト（配置・余白）を直感的に把握できるようにする。
  - **使用例:** `display (flex/grid)`, `margin`, `padding`（グリッド・コンテナ余白）, `width`, `height`, `gap`, `position`, `text-align`
  - **※ 装飾（カラー、シャドウ、グラデーション等）はTailwindで行わず、Scoped CSSに委ねる。**
- **Vue Scoped CSS（装飾・タイポグラフィカプセル化）**
  - **対象:** 複雑な装飾、境界線、カラー、特殊な状態、長いCSSプロパティが必要なもの。
  - **文字・文字連動余白（タイポグラフィ・ユニット）:**
    - 文字（`font-size`, `color`, `font-weight`, `line-height`）は不可分の一体物として、Atoms / Molecules の Scoped CSS に定義します。
    - ボタンや入力欄など、文字サイズに追従すべきコントロールの内側余白（`em` パディング）は、文字サイズとセットで Scoped CSS にカプセル化します（無駄なラッパーを作らず、タイポグラフィ計算を1箇所で完結させるため）。
  - **※ 画面グリッドに従う余白（px/rem）やレイアウト（`z-index`, `justify-content`, `align-items`, `flex-direction`, `flex-shrink`, `row-gap`, `column-gap` 等）をScoped CSSに直接書くのは禁止。**

### 余白管理の原則（セマンティック余白体系と完全機械的ガード）
- **セマンティック余白への完全統一:**
  - 画面内のすべての余白（`padding`, `margin`, `gap`）は、**プロジェクト定義済みのセマンティック変数（5階層・9トークン）のみ** を使用します。
  - 生の数値（`gap-3`, `gap-5`, `gap-1.5`, `p-2.5` 等）や任意値構文（`gap-[var(...)]`）の記述は、**ESLint (`local/strict-spacing-tokens`) により完全禁止（ビルドエラー）** されます。

| 階層 | 用途 | CSS変数 | 許可されるTailwindクラス |
| :--- | :--- | :--- | :--- |
| **L1: Layout** | 画面最外周パディング | `--space-layout-pad` (12〜24px Fluid) | `p-layout-pad` |
| **L2: Section** | 大セクション間、2ペイン分割間 | `--space-section-gap` (20〜32px Fluid) | `gap-section-gap` |
| **L3: Panel** | パネル内余白（標準）<br>パネル内余白（リスト行・カード用）<br>パネル・カード同士の間隔 | `--space-panel-pad` (12〜20px Fluid)<br>`--space-panel-pad-compact` (12px 固定)<br>`--space-panel-gap` (8〜16px Fluid) | `p-panel-pad`<br>`p-panel-pad-compact`<br>`gap-panel-gap` |
| **L4: Form** | フォーム行間（上下）<br>フォーム列間（左右） | `--space-form-row-gap` (16px)<br>`--space-form-col-gap` (16px) | `gap-form-row-gap`<br>`gap-form-col-gap` |
| **L5: Item** | リスト項目間、ボタン列、バッジ間 | `--space-item-gap` (8px) | `gap-item-gap`, `p-item-gap` |
| **L5: Inline** | アイコンとテキスト、ラベルと入力欄 | `--space-inline-gap` (4px) | `gap-inline-gap` |
| **Reset** | デフォルト余白の打ち消し、端寄せ | `0px`, `auto` | `m-0`, `p-0`, `ml-auto` 等 |

- **サーフェス部品（`Panel`）の余白カプセル化:**
  - `Panel` は背景・枠線・影のみを提供する純粋なサーフェス枠です。
  - 余白は `padding?: 'normal' | 'compact' | 'none'` プロパティで制御します。
  - **親が外から `<Panel class="p-3">` や `<Panel class="p-0">` などの余白クラスを渡すアンチパターンは ESLint で全面禁止されています。**
- **Margin is harmful 原則（子要素マージンの撲滅）:**
  - 要素自身に外側余白（`mb-1` 等）を持たせることを禁止します。配置する親コンテナが `flex flex-col gap-inline-gap` や `gap-item-gap` で子要素間の間隔を一元管理してください。

### 双方向リント監視（完全機械的ガード）
本方針を人手任せにせず確実に徹底するため、リントツールによる「双方向の機械的チェック」を敷いています：
1. **ESLint (`local/no-tailwind-decoration`, `local/strict-spacing-tokens`):**
   - テンプレート内での装飾系Tailwindクラス（`bg-*`, `text-*`, `rounded-*`, `border-*`, `shadow-*` 等）の使用を完全禁止し、Scoped CSSへの分離を強制。
   - 定義済みセマンティック余白トークン以外の未定義クラス（`gap-3`, `gap-1.5`, `p-2.5`, `gap-[...]` 等）の使用を完全禁止。
   - `<Panel>` に対する余白クラス（`p-*`）の直接指定を完全禁止し、`padding` プロパティの使用を強制。
2. **Stylelint (`.stylelintrc.cjs`):**
   - Scoped CSS内でのレイアウト関連プロパティ（`z-index`, `justify-content`, `align-items`, `flex-direction`, `flex-shrink`, `row-gap`, `column-gap` 等）の記述を完全禁止。
   - Scoped CSS内での固定余白（`px` / `rem`）の直接記述を禁止し、文字連動余白（`em`）および CSS 変数のみ許可。

---

## 2. コンポーネントディレクトリ設計・命名規則（ドメイン・アトミック統合方式）

開発時の見通しとアトミックデザインの階層（立場）を一目で明確にするため、**「業務ドメイン（機能）」ディレクトリ内に配置する場合もアトミックプレフィックス（`Organisms...` 等）を付与**します。
Nuxt 3 のコンポーネント自動プレフィックス機能（`nuxt.config.ts`）により、テンプレート上は `<ToolOrganismsVoltageInput>` のようにドメイン名とアトミック階層が明示されます。

### ディレクトリ構造とタグ名の対応関係

```
app/components/
├── AtomsButton.vue                  # ➔ <AtomsButton>
├── MoleculesFormGroup.vue           # ➔ <MoleculesFormGroup>
├── MoleculesDashboardMenuTile.vue   # ➔ <MoleculesDashboardMenuTile>
├── OrganismsHeader.vue              # ➔ <OrganismsHeader>
├── OrganismsModal.vue               # ➔ <OrganismsModal>
│
├── tool/                            # 電卓・計算ツール専用
│   ├── TemplatesLayout.vue          # ➔ <ToolTemplatesLayout>
│   ├── OrganismsVoltageInput.vue    # ➔ <ToolOrganismsVoltageInput>
│   ├── OrganismsVoltageResult.vue   # ➔ <ToolOrganismsVoltageResult>
│   ├── OrganismsConduitInput.vue    # ➔ <ToolOrganismsConduitInput>
│   ├── OrganismsRackInput.vue       # ➔ <ToolOrganismsRackInput>
│   ├── OrganismsRackResult.vue      # ➔ <ToolOrganismsRackResult>
│   └── OrganismsHistoryPanel.vue     # ➔ <ToolOrganismsHistoryPanel>
│
├── portal/                          # 送電ポータル・現場管理専用
│   ├── OrganismsPhase1Table.vue     # ➔ <PortalOrganismsPhase1Table>
│   └── OrganismsSiteSettingsModal.vue# ➔ <PortalOrganismsSiteSettingsModal>
│
└── database/                        # 規格データベース専用
    └── TemplatesLayout.vue          # ➔ <DbTemplatesLayout>
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
  - Props, Emits, Slot のみを使用。API通信やグローバル状態管理（useState）は**絶対禁止**。
- **CSS方針:**
  - Scoped CSS が主役。境界線、エフェクト、フォント装飾、アニメーションなどの複雑な装飾はここに閉じ込める。
  - レイアウト（`inline-flex`, `items-center`, `padding` など）のみ Tailwind クラスで指定。

---

### 2.2. `Molecules...` （分子）
Atomsを2〜3個組み合わせた、単一機能の最小UIブロック。

- **命名規則:** `Molecules{ComponentName}.vue` （例: `MoleculesInputGroup.vue`, `MoleculesFormGroup.vue`, `MoleculesKanaFilter.vue`）
- **判定基準:** **他のMoleculesを内包しておらず、純粋にAtomsのみを組み合わせた最小単位か？**
- **ルール:**
  - 汎用性を保つ（API通信やグローバル状態管理は禁止のDumbコンポーネント）。
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
  3. アプリ固有のデータ型を扱っている、またはAPIやComposableと連携している
- **ルール:**
  - AtomsとMoleculesを組み合わせて構築する。
  - ビジネスロジック（データ取得・保存）や状態を持ってもよい（ただし直接の `$api` 通信は禁止し、専用 Composable 経由で行う）。
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
> - **Q. アプリ専用のデータ型（User型等）やAPI通信・グローバル状態が混ざっているか？**
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

---

## 5. UIインタラクション状態（Interaction State）の書き方・書き順規約

UIコンポーネントにおけるすべてのインタラクション状態（操作可能、選択中、処理中、無効化など）は、**手書きコードの乱立を防ぎデザインの一貫性を保証するため、プロジェクト共通の状態 Mixin（`_states.scss`）を使用** します。

### 5.1. 状態 Mixin 体系（`_states.scss`）

| カテゴリ | Mixin 名 | 適用対象 | 役割・内包スタイル概要 |
| :--- | :--- | :--- | :--- |
| **サーフェス系** | `@include state-interactive;` | パネル、カード、タイル等 | `is-interactive` 時の hover（8%ティント）、focus-visible、active（12%ティント + 縮小） |
| **サーフェス系** | `@include state-selected;` | パネル、選択行、カード等 | `is-selected` 時の 135deg 対角グラデーション（14%）および操作連動（18% / 22%） |
| **コントロール系** | `@include state-control-interactive { ... }` | ボタン、タブ、入力欄等 | 操作可能時（`&:not(:disabled, .is-disabled)`）のホバー・フォーカス・アクティブのガード |
| **共通終端** | `@include state-loading;` | ボタン、パネル、モーダル等 | `is-loading` / `--loading` 時のポインター無効化・カーソル wait・透過度 0.75 |
| **共通終端** | `@include state-disabled;` | **全コンポーネント共通** | `&:disabled` / `is-disabled` 時のポインター無効化・透過度 0.55・grayscale 100%（最優先打ち消し） |

### 5.2. 書き順（Order）の原則

CSS カスケードの論理（後から書いたスタイルが優先）に従い、以下の書き順を厳守します。

#### サーフェス系テンプレート（例: `AtomsPanel`）
```scss
.panel {
  // ① 静的宣言 (Base Declarations)
  border: var(--border-width-base) solid var(--color-border);
  background: var(--surface-bg);
  transition: var(--transition-panel);

  // ② 状態管理 (State Management)
  @include state-interactive; // 1. 通常操作
  @include state-selected;    // 2. 選択状態
  @include state-disabled;    // 3. 無効化（最末尾）
}
```

#### コントロール系テンプレート（例: `AtomsButton`）
```scss
.btn {
  // ① 静的宣言 (Base Declarations)
  cursor: pointer;
  background-color: var(--btn-bg);
  transition: var(--transition-interactive);

  // ② 操作ガード (Interactive Guard)
  @include state-control-interactive {
    &:hover { ... }
    &:focus-visible { ... }
    &:active { ... }
  }

  // ③ バリアント・子要素ルール (Variants & Sub-rules)
  &--danger { ... }
  &--secondary { ... }

  // ④ 終端状態 (Terminal States) - カスケード最末尾
  @include state-loading;
  @include state-disabled;
}
```

### 5.3. Stylelint による自動監視・強制

本規約は、`.stylelintrc.cjs` によりエディタ上および CI でリアルタイムに自動強制されます。

1. **手書き（ハードコード）の禁止 (`selector-disallowed-list`)**:
   - 生の `&:disabled`、`&.is-disabled`、`&.is-interactive`、`&.is-loading` を手書きした瞬間にビルド・Lint エラーとなります。
2. **書き順（Order）違反の検知 (`order/order`)**:
   - `state-interactive` ➔ `state-control-interactive` ➔ `state-selected` ➔ `rules` ➔ `state-loading` ➔ `state-disabled` の順序が崩れていると Lint エラーになります（`--fix` で自動修復可能）。

### 5.4. コンポーネント構造の原則（YAGNI / DRY）

- リストアイテム（`MoleculesSiteListItem` など）やタイル（`MoleculesDashboardMenuTile` など）は、自身で状態 CSS を書かず、`<AtomsPanel interactive :selected="selected" :disabled="disabled">` にサーフェス状態の責務を一任することを最優先とします。

---

## 6. アプリケーション状態管理（State Management）アーキテクチャ規約

本プロジェクトでは、「すべてを1つのライブラリに押し込める過剰設計」を避け、状態のライフサイクルと影響範囲に応じた**4層アーキテクチャモデル**を採用します。

### 6.1. 状態の4層分類と標準実装パターン

| 階層 | 状態の性質 | 推奨実装技術 | 寿命・スコープ | 具体例 |
| :--- | :--- | :--- | :--- | :--- |
| **L1: UI一時状態** | 単一コンポーネント内の描画・操作状態 | コンポーネント内 `ref` / `_states.scss` | コンポーネント破棄で消滅 | 検索窓の入力文字列、アコーディオン開閉 |
| **L2: 画面・フォーム状態** | 画面固有の複数UI連携・一時入力 | 専用オーケストレーション Composable | 画面遷移やリセットで消滅 | `useAdminSitesTab`, `useVoltageCalculator` |
| **L3: サーバーキャッシュ状態** | サーバーが原本を持つ業務データ | `useApi().$api` + `useAsyncData` / Composable | 画面再訪時または明示的更新で同期 | 回路一覧、ユーザー一覧、測定機器台帳 |
| **L4: アプリ共有・永続状態** | アプリ全体で共有、または端末保存 | `useState` (`STATE_KEYS`) / `useLocalStorage` | アプリ起動中 / 端末保存 | ログインユーザー、テーマ設定、サイドバー開閉 |

### 6.2. 3大鉄則（ESLint 機械的ガードレール）

手作業での規約維持を防ぐため、以下の 3原則は **ESLint (`local/strict-state-management`) により完全自動監視（違反時はビルドエラー）** されます：

1. **通信クライアントは `$api` に完全一本化（素の `$fetch` 呼び出しの禁止）:**
   - 認証トークン（Bearer）の自動付与、セッション切れ（401 Unauthorized）時の自動ログイン画面リダイレクト、および `AppException` への例外正規化を保証するため、素の `$fetch` は禁止です。
   - 必ず `const { $api } = useApi()` を使用して API 通信を行ってください。
2. **`useState` のキーは `STATE_KEYS` に完全一元化（文字列リテラルの禁止）:**
   - キーの重複衝突やタイポ、破棄漏れを防ぐため、`useState('xxx')` のような直接の文字列リテラル指定は禁止です。
   - すべてのキーは `app/constants/storageKeys.ts` の `STATE_KEYS` に登録して参照してください。
3. **プレゼンテーション層の純粋性の維持（コンポーネント内 API 通信の禁止）:**
   - Vue コンポーネント内（`app/components/**/*.vue`）で直接 `$api` を呼び出したり通信ロジックを抱え込むことは禁止です。
   - 必ず専用の Composable（例: `useMeasurementDeviceForm`）にロジックをカプセル化し、コンポーネントは表示とイベント伝達に専念させてください。




