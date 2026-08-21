---
name: Design Conventions
description: "電気設計コンソールのUI/UXデザイン規約"
---

# UI/UX デザイン規約 (Design Conventions)

## 1. 全体レイアウトとテーマ
- **対象ユーザー**: プロフェッショナルな電気設計技術者
- **テーマ**: ダークテーマ（またはライトテーマ）をベースとした高密度かつクリーンなインターフェース。
- **レイアウト**:
  - 左カラム: 各種計算ツールへのナビゲーションメニュー
  - 中央カラム: パラメータ入力フォーム（Vee-Validate / Zodベース）
  - 右カラム（または下部）: 計算結果および数式（KaTeX）プレビューペイン

## 2. コンポーネントとスタイリング
- **CSSフレームワーク**: 既存のSCSSカスタムスタイルを継承しつつ、ユーティリティクラスを活用して一貫性を保つ。
- **基本クラス**: `AppCard`, `AppPanel`, `AppButton`, `AppInput` などの共通コンポーネントを優先的に使用する。
- **状態カラー（Semantic Colors）**:
  - `is-success` / `color-status-success`: 要件を満たしている、安全圏（例: 緑）
  - `is-warning` / `color-status-warning`: 注意が必要、ギリギリの設計（例: 黄・オレンジ）
  - `is-danger` / `color-status-danger`: 要件を満たさない、エラー（例: 赤）

## 3. 計算結果の表示ルール (最重要事項)
計算結果において、視覚的フィードバック（色）を与える対象は**「数値部分」のみ**とする。

- **単位・括弧への色付け禁止**:
  - 単位（例: `A`, `V`, `mm`, `kg`, `%`）や、区切り文字（`/`, `()`, `:`）に対して、Success/Danger等の状態カラー（色付け）を適用してはならない。
  - 単位は常に `var(--color-text-secondary)` または `var(--color-text-muted)` のグレー系カラーとし、控えめに表示する。
- **実装上の注意点**:
  - CSSで親要素（例: `.metric-value`）に `.is-success` 等のクラスを付与した場合、子要素である単位表示（`.value-unit` 等）がCSS継承によって意図せず着色されるケースに注意する。
  - 必ず `.value-unit` クラス内で `color: var(--color-text-secondary);` を明示的に指定し、色の上書きを防ぐこと。
  - MathJax/KaTeX の数式内においても、`\htmlClass{tex-status-success}{...}` の適用範囲は数値のみとし、`\text{ [A]}` のような単位部分はクラスの外側に配置する。
