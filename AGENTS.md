# AGENTS.md

## 1. 共通コンポーネント完全凍結（ロック）規約とハック禁止原則

1. **共通コンポーネント（`app/components/common/**`）の変更凍結（ロック）**
   - `app/components/common` 配下の全 30 コンポーネント（Atoms / Molecules / Organisms）および関連型定義（`app/types/components.ts`）は、Vercel Geist デザインシステム仕様・直角規約・セマンティック HTML 方針への準拠を完了し、**確定・凍結（ロック）** されています。
   - 新規機能追加や修正時であっても、共通コンポーネントを独断で改変・拡張・不要なラッパーで再ラップすることを厳禁とします。

2. **呼び出し側（Consumer）でのハック・迂回工作の厳禁（指示仰ぎの徹底）**
   - 「共通コンポーネントがロックされているから」という理由で、呼び出し側（各画面 `/pages` や各機能コンポーネント）で無理な CSS 上書き（`!important`、ネガティブマージン、`:deep()` ハック）、ラッパー要素の乱立、インラインでのオレオレ再実装等のハック修正を行うことを固く禁止します。
   - 共通コンポーネント自体のプロップ不足やスタイル調整、機能拡張が真に必要だと判断した場合は、**決して呼び出し側で誤魔化さず、「〇〇コンポーネントの△△の修正が必要です」とユーザーに明示して修正の指示・許可を仰いでください**。

---

## 2. コンポーネント階層と `<style scoped>` 禁止規約

1. **Templates / Pages 以降での `<style>` ブロック完全禁止（`local/no-page-scoped-css`）**
   - **対象**: `app/pages/**`, `app/layouts/**`, および画面テンプレート・タブ・モーダル層（`app/components/master/**`, `app/components/portal/admin/**`, `app/components/portal/reports/**`, `app/components/portal/souden/**`, `app/components/portal/calendar/ModalCalendarEvent.vue`）。
   - これらのファイルでは `<style scoped>` を含む `<style>` ブロックの記述を一切禁止します。
   - 画面構築は、凍結された共通コンポーネント（`app/components/common/**`）、Foundation CSS クラス（`.panel`, `.panel.is-elevated`, `.panel.is-sunken`, `.panel.is-interactive`, `.divider`, `.label`, `.field-help-text`, `.error-text`）、セマンティック HTML タグ（`<h1>`〜`<h4>`, `<strong>`, `<small>`, `<code>`, `<time>`, `<del>`）、およびレイアウト用 Tailwind クラスのみで行ってください。

2. **過剰共通化の禁止（YAGNI原則の遵守）**
   - 1画面特化や単なる薄いラッパーとなるコンポーネント（旧 `InfoList`, `MenuTile`, `PanelGlossary`, `MasterCrudLayout` 等）は作成せず、利用側画面に直接インライン記述してください。
   - サイズ拘束済み共通コンポーネント（`Button`, `Input`, `Select`, `Toggle`, `Switch`, `Progress`, `Spinner`）に対し、外部から高さ・パディング・文字サイズクラス（`h-*`, `p-*`, `text-*`）を上書き付与することは禁止です（`local/strict-component-usage` により自動検証）。

---

## 3. CSS・デザインシステム規約

1. **Tailwind CSS の用途制限（`local/no-tailwind-decoration`, `local/strict-spacing-tokens`）**
   - Tailwind CSS は **レイアウト・配置・サイズ制御**（`flex`, `grid`, `items-*`, `justify-*`, `w-*`, `h-*`, `min-*`, `max-*`, `overflow-*`, `shrink-*`, `grow-*`, `col-*`, `row-*`）および **テキスト省略・等幅数値・改行制御**（`truncate`, `tabular-nums`, `whitespace-*`, `text-left/center/right`）のみに使用してください。
   - 色（`text-red-*`, `bg-*`, `border-*`）、フォントサイズ・太さ（`text-xs`, `font-bold`）、装飾（`rounded-*`, `shadow-*`, `cursor-*`）に Tailwind クラスを使用することは禁止です。
   - 余白（`gap-*`, `p-*`, `m-*`）には `tailwind.config.ts` に定義されたセマンティックトークン（`section-gap`, `panel-gap`, `panel-pad`, `panel-pad-compact`, `item-gap`, `inline-gap`, `micro-gap`, `form-row-gap`, `form-col-gap`）または標準数値スケールを使用してください。

2. **直角（Zero-Radius）原則（Stylelint 強制）**
   - 直角（`border-radius: 0`）がプロジェクトの標準です。カードやボタンの四隅を丸くする行為は厳禁です。
   - 例外として幾何学的真円（`50%` または `var(--radius-circle)`：Avatar、StatusDot、Radio 等）およびリセット（`0`）のみが許可されます。

3. **Foundation サーフェスとセマンティック要素**
   - `.panel`：標準パネル（`--surface-bg`）
   - `.panel.is-elevated`：浮き上がりサブパネル（`--surface-bg-elevated`）
   - `.panel.is-sunken`：沈み込みウェル・ツールバー領域（`--surface-bg-sunken`）
   - `.panel.is-interactive`：ホバー光彩・アクティブ状態を持つクリック可能領域
   - `<code>`：ID、コード、定数、数値データ等のモノスペースチップ表示
   - `<time>`：日時・タイムスタンプのモノスペース・ミュート表示
   - `<small>`：補足説明・サブラベルのミュート表示
   - `<del>`：完了済みタスク等の取り消し線・減光表示
   - `.error-text`：フォームバリデーションエラー等の赤色警告テキスト

4. **CSS カスタムプロパティのスコープ評価と動的グロートークン規約（`:root` 青色固定バグ防止）**
   - CSS 仕様上、`:root`（`app/assets/scss/foundation/_themes.scss`）で `var(--theme-accent)` や `var(--glow-color)` を参照して定義された派生トークン（`--shadow-glow-*`, `--surface-rim-accent`, `--surface-gradient-glow`, `--btn-primary-*` 等）は、**宣言された `:root` 時点の `--theme-accent`（＝デフォルトの青色 `--color-category-main`）で計算・確定された値**が子要素へ継承されます。
   - そのため、`default.vue` や `index.vue` の各セクション等で `--theme-accent` や `--glow-color` を動的に切り替える構造において、子要素が `:root` の派生トークンをそのまま参照すると、親のカテゴリー色が無視されて常に青色で発光するバグが発生します。
   - **必須ルール**:
     1. `--shadow-glow-*`、`--surface-rim-accent`、`--surface-gradient-glow` を使用するすべてのサーフェス（`.panel`, `.result-tile`, `.label` 等）およびインタラクティブコンポーネントのルート（または対象セレクタ）では、**必ず `@include control-glow-tokens;`（`app/assets/scss/foundation/mixins/_states.scss`）を呼び出し、要素自身のスコープで派生トークンを再計算させること**。
     2. コンポーネント内で `--theme-accent` に依存する背景色や枠線色を定義する場合、`:root` で確定済みの二次変数（`--btn-primary-bg` 等）をそのまま参照せず、要素ローカルで `color-mix(in srgb, var(--theme-accent) ..., ...)` を評価するか、`@include control-glow-tokens;` を併用すること。

---

## 4. HTML仕様・アクセシビリティ規約

1. **純粋な支援アクセシビリティ属性の禁止（`local/no-pure-accessibility`）**
   - コード量削減と属性不整合バグ防止のため、純粋な支援技術向け属性（`aria-*` および `role`）の使用は原則禁止です。
   - **ネイティブ HTML 属性（`title`, `tabindex`, `for`, `id`, `disabled`, `readonly`, `type` 等）およびセマンティック HTML タグの使用は標準通り許可・推奨**されます。

2. **セマンティック HTML の徹底**
   - フォーム要素はネイティブな `<label for="fieldId">` とコントロール（`<Input id="fieldId">`, `<Select id="fieldId">` 等）を直接関連付けます。
   - 静的テキストや複数入力コントロール群、内部に `<label>` を持つコントロール（`Dropzone`, `Checkbox`, `Toggle`, `Radio`）を外部 `<label>` で二重に囲むこと（Orphan Label / 二重 Label）を禁止します。
   - `<ul>` / `<ol>` 直下には必ず `<li>` のみを配置してください（`local/strict-semantic-html`）。

---

## 5. 実装ガードレール（手戻り・バグ防止）

1. **日時・時刻処理（`local/no-new-date-without-args`）**
   - 引数なし `new Date()` や `Date.now()` は禁止です。サーバー時刻補正済みの `useAuth().getAccurateNow()` または `getAccurateNowIso()` を使用してください。
   - `toISOString().split('T')[0]` は JST 日付ズレ防止のため禁止です。`app/utils/date.ts` の `formatToDateInputString()` を使用してください。

2. **通信・状態管理（`local/no-raw-fetch`, `local/strict-state-keys`）**
   - 素の `$fetch` や `fetch` は禁止です。CSRF ヘッダー・認証エラーハンドリング統合済みの `useApi().$api`（または `useNuxtApp().$api`）を使用してください。
   - `useState` の第1引数にはハードコード文字列を使用せず、`app/constants/storageKeys.ts` の `STATE_KEYS` を必ず参照してください。

3. **主要共通コンポーネントの使い分け（Vercel Geist 準拠）**
   - **Button**: 主目的アクションは1画面1つの `variant="primary"`、通常操作は `variant="secondary"`、補助操作は `variant="tertiary"`、破壊的操作は `variant="danger"`。ページ遷移には `<Button to="...">` を使用。
   - **Badge / StatusDot**: 静的な状態ラベル（クリックイベント付与禁止）。文章ではなく短い状態単語を指定。
   - **Gauge / Progress**: 健全性・達成比率（0〜100%の円形メーター）には `<Gauge>`、確定タスクの進行過程（水平バー）には `<Progress>` を使用。
   - **Checkbox / Toggle / Switch / Radio / Select / Combobox**:
     - マルチセレクト・規約同意 → `<Checkbox>`
     - 単一真偽値の即時 ON/OFF → `<Toggle>`
     - 2〜3項目の排他的な表示・モード切替 → `<Switch>`
     - 少数の排他的単一選択リスト → `<Radio>`
     - 10件未満の固定選択肢 → `<Select>`
     - 件数が多い選択肢・インクリメンタル検索 → `<Combobox>` / `<MultiSelect>`
   - **Banner / Note / Toast**:
     - 画面全幅のシステム重要告知（オフライン等） → `<Banner>`
     - セクション・フォーム内の局所的なインライン告知 → `<Note>`
     - 操作完了・エラーの一時通知 → `useToast()`（ネイティブ `alert()` / `confirm()` は使用せず `useToast()` / `useModal().askConfirm()` を使用）
