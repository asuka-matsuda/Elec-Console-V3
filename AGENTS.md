# AGENTS.md

## 設計原則・コンポーネント規約

1. **過剰共通化の禁止（YAGNI原則の遵守）**
   - 1画面特化や単なる薄いラッパーとなるコンポーネント（旧 `InfoList`, `MenuTile`, `PanelGlossary`, `MasterCrudLayout` 等）は作成せず、利用側画面に直接インライン記述してください。
   - レイアウトや枠線、パディングのみを目的とした無理な抽象化・神コンポーネントの作成を禁止します。

2. **HTML仕様・アクセシビリティの遵守（セマンティクスの優先）**
   - フォーム要素はネイティブな `<label :for="fieldId">` とコントロール（`<Input>`, `<Select>` 等）を直接関連付けます。
   - 静的テキスト表示や複数の入力コントロール群（チェックボックス群、ラジオボタングループ等）、内部に `<label>` を持つコントロール（`ExcelDropzone` 等）を包括ラベルで囲む仕様違反（Orphan Label / 二重 Label）を厳禁とします。
   - `<ul>` 直下には必ず `<li>` のみを配置し、ブロック要素を直接挿入しないでください。
   - `aria-*` や `role` 等の純粋な支援アクセシビリティ属性は規約（`local/no-pure-accessibility`）により原則禁止です。コード量削減と属性の不整合バグ防止のため、セマンティックなHTML構造のみで記述してください。

3. **CSS・デザインシステムの遵守**
   - 装飾や文字サイズ（`text-xs`, `cursor-pointer`, `bg-*`, `border-*` 等）に Tailwind を使用せず、レイアウト（`flex`, `grid`, `gap`, `padding` 等）のみ Tailwind を使用してください。装飾や色は Scoped CSS / CSS 変数で定義します。
   - クリック可能なアイテム・サーフェスには `.panel.is-interactive` クラスを活用し、ホバー光彩やアクティブ状態を統一します。
   - 直角がプロジェクトの標準です。`border-radius` の安易な追加は避けてください。

4. **AI開発における最重要ガードレール（手戻り・バグ防止）**
   - **日時・時刻処理**: 引数なし `new Date()` は禁止（`useAuth().getAccurateNow()` または `getAccurateNowIso()` を使用）。`toISOString().split('T')[0]` もJSTズレ防止のため禁止（`app/utils/date.ts` の `formatToDateInputString()` を使用）。
   - **通信・状態管理**: 素の `$fetch` は禁止（`useApi().$api` を使用）。`useState` のキーは `app/constants/storageKeys.ts` の `STATE_KEYS` を必ず参照。
   - **共通Atoms**: `Button`, `Input`, `Select`, `Checkbox`, `Textarea`, `Icon` の厳選された6コンポーネントのみを共通Atomsとして使用します。
   - **Dead Code 禁止**: コメントアウトされた古いコード（`// const ...` 等）を残さないでください。


