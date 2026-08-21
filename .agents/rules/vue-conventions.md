`elec-console-v2` プロジェクトでVueコンポーネントやロジックを実装・改修する際は、以下のルールを遵守すること：

1. **コンポーネントの構造と命名 (Component Structure & Naming)**:
   - ファイル内のブロックは `<script setup lang="ts">` -> `<template>` -> `<style scoped lang="scss">` の順序で統一する。
   - アプリケーション全体で再利用される汎用UIコンポーネント（ボタン、入力フォーム、モーダル等）には、必ず `App` プレフィックスを付ける（例: `AppButton.vue`, `AppModal.vue`）。
   - CSSクラス命名はBEM記法をベースとし、汎用コンポーネントには `c-`、ページレベルのレイアウトには `p-` のプレフィックスを付与する（例: `.c-btn`, `.c-btn--primary`, `.p-dashboard__section`）。
   - 動的なクラスバインディングは、Vueの配列・オブジェクト構文を用いてDRYに記述する（例: `:class="['c-btn', _variant && \`c-btn--${_variant}\`, { 'is-disabled': disabled }]"` ）。

2. **Vue Composition API と TypeScript (Reactivity & Types)**:
   - **Props**: 型ベースの宣言を使用し、デフォルト値が必要な場合は `withDefaults` で定義する。
   - **Emits**: `defineEmits<{ (e: 'update:modelValue', value: string): void }>()` のように型安全に定義する。
   - **リアクティビティ**: 状態管理には `ref` を基本とする。既存の状態から派生する値には積極的に `computed` を使用し、テンプレート内の複雑なロジックを排除する。
   - **型の安全性**: `any` 型の使用は極力避け、明示的に `interface` または `type` を定義して型安全性を担保する。

3. **ロジックの分離 (Composables & Utils)**:
   - **Composables (`composables/`)**: ライフサイクルフックや状態（`useState`, `useLocalStorage`等）を伴う再利用可能なビジネスロジックは `useXXX.ts` として抽出する。
   - **Utils (`utils/`)**: 状態を持たない純粋な関数（複雑な計算処理、データ変換など）や定数群は `utils/` ディレクトリに配置する。
   - Vueコンポーネントの `<script setup>` が肥大化（目安: 約150行以上）した場合は、上記方針に従い積極的にロジックを分離すること。

4. **ハードコードの原則禁止 (No Hardcoding)**:
   - UIの表示テキスト、エラーメッセージ、特定のステータスコード、およびマジックナンバー等をコンポーネントやロジック内に直接ハードコードすることを原則禁止する。
   - アプリケーション全体で共有される定数や設定値は、`utils/constants/` ディレクトリ等の適切な場所に定数（定数ファイル）として定義し、そこからインポートして使用すること。
