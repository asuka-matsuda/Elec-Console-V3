/**
 * UI コンポーネント共通型定義
 *
 * ボタン、フォーム入力、モーダル、テーブルカラム等の共通 Props / Emits インターフェースを定義します。
 */

import type { IconName } from '~/constants/icons'

// ============================================================================
// 1. 共通UIデータ型 & 選択肢オプション型 (Common Options & Table / Nav)
// ============================================================================

/** 汎用セレクトボックス用選択肢 */
export interface SelectOption<T = string | number | boolean> {
  label: string
  value: T
  disabled?: boolean
  color?: string
}

/** 汎用ラジオボタングループ用選択肢 (SelectOption と同等) */
export type RadioOption<T = string | number | boolean> = SelectOption<T>

/** 汎用タブ選択肢 */
export interface TabOption<V = string | number> {
  label: string
  value: V
  disabled?: boolean
  /** タブ左側に表示するアイコン（任意） */
  icon?: IconName
  /** タブ右側に表示するバッジ（任意） */
  badge?: string | number
  /** バッジの発光色（任意。CSS変数またはカラー値） */
  badgeColor?: string
}

/** 汎用テーブルカラム定義 */
export interface TableColumn<T = Record<string, unknown>> {
  key: (keyof T & string) | string
  label: string
  /** ソート可能フラグ（明示的に true の場合のみソート有効） */
  sortable?: boolean
  /** 列幅（例: '120px', '20%'） */
  width?: string
  minWidth?: string
  maxWidth?: string
  align?: 'left' | 'center' | 'right'
  /** この列でテキスト省略（...）を行うかどうか */
  truncate?: boolean
  /** 値が空（null, undefined, 空文字）の時のフォールバック表示 */
  emptyFallback?: string
  /** セルに適用する追加クラス */
  class?: string
  /** 2段組セル等のサブキー */
  subKey?: string
  /** 表示値のカスタムフォーマッタ関数 */
  format?: (value: unknown, row: T) => unknown
}

/** パンくずリスト項目 */
export interface BreadcrumbItem {
  text: string
}

// ============================================================================
// 2. Atoms（最小構成要素）
// ============================================================================

// --- Button ---
export type ButtonVariant = 'default' | 'success' | 'danger'

export interface ButtonProps {
  to?: string
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  icon?: IconName
  /** ホバーツールチップテキスト・アクセシビリティ用ラベル */
  title?: string
}

// --- Checkbox ---
export interface CheckboxProps {
  /** HTML id属性 */
  id?: string
  /** チェックボックスの値（配列 v-model 時に使用） */
  value?: unknown
  /** ラベルテキスト */
  label?: string
  /** 無効化フラグ */
  disabled?: boolean
  /** エラー状態フラグ (デフォルト: false) */
  error?: boolean
  /**
   * バリアント（未指定時は default = 選択用）
   * - default: 通常の選択・トグル（テーマアクセント色）
   * - success: タスク完了・検査確認（グリーン）
   */
  variant?: 'default' | 'success'
  /** カテゴリカラー等のカスタム色指定 */
  color?: string
  /** ホバーツールチップテキスト */
  title?: string
}

// --- Icon ---
type IconSize = 'sm' | 'md' | 'lg'

export interface IconProps {
  name: IconName
  size?: IconSize
  spin?: boolean
}

// --- Input ---
export type InputType
  = 'text'
    | 'password'
    | 'email'
    | 'number'
    | 'search'
    | 'tel'
    | 'url'
    | 'date'
    | 'datetime-local'
    | 'time'

export type InputMode
  = 'none'
    | 'text'
    | 'decimal'
    | 'numeric'
    | 'tel'
    | 'search'
    | 'email'
    | 'url'

export interface InputProps {
  /** HTML id属性 */
  id?: string
  /** フォーム名属性 */
  name?: string
  /** 入力タイプ (デフォルト: 'text') */
  type?: InputType
  /** プレースホルダー */
  placeholder?: string
  /** 無効化状態 (デフォルト: false) */
  disabled?: boolean
  /** 読み取り専用状態 (デフォルト: false) */
  readonly?: boolean
  /** エラー状態フラグ (デフォルト: false) */
  error?: boolean
  /** 最小値（number / date / time 等） */
  min?: number | string
  /** 最大値（number / date / time 等） */
  max?: number | string
  /** ステップ刻み値（number / date / time 等） */
  step?: number | string
  /** 入力モード (仮想キーボード制御) */
  inputmode?: InputMode
  /** ブラウザ自動補完 */
  autocomplete?: string
  /** 最大文字数 */
  maxlength?: number
  /** ホバーツールチップテキスト・アクセシビリティ用ラベル */
  title?: string
}

// --- Select ---
export interface SelectProps<T = string | number | boolean> {
  /** 選択肢リスト */
  options?: SelectOption<T>[]
  /** プレースホルダー */
  placeholder?: string
  /** 無効化状態 (デフォルト: false) */
  disabled?: boolean
  /** エラー状態フラグ (デフォルト: false) */
  error?: boolean
  /** HTML id属性 */
  id?: string
  /** フォーム名属性 */
  name?: string
  /** ホバーツールチップテキスト */
  title?: string
}

// --- Textarea ---
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both'

export interface TextareaProps {
  /** HTML id属性 */
  id?: string
  /** フォーム名属性 */
  name?: string
  /** 行数 (デフォルト: 4) */
  rows?: number
  /** リサイズ方向 (デフォルト: 'vertical') */
  resize?: TextareaResize
  /** プレースホルダー */
  placeholder?: string
  /** 無効化状態 (デフォルト: false) */
  disabled?: boolean
  /** 読み取り専用状態 (デフォルト: false) */
  readonly?: boolean
  /** エラー状態フラグ (デフォルト: false) */
  error?: boolean
  /** 入力内容に応じた高さ自動伸縮（オートリサイズ） (デフォルト: false) */
  autoResize?: boolean
  /** 最大文字数 */
  maxlength?: number
  /** ホバーツールチップテキスト・アクセシビリティ用ラベル */
  title?: string
}

// --- Table ---
export type TableSortOrder = 'asc' | 'desc' | null

// ============================================================================
// 3. Molecules（複合コンポーネント）
// ============================================================================

// --- Calculation Status & Details ---
export type ResultStatus = 'neutral' | 'success' | 'warning' | 'danger' | 'empty'
export type ResultTileStatus = ResultStatus

export interface ResultDetailItem {
  label: string
  value: string | number
  unit?: string
  note?: string
}

// --- EmptyState ---
export interface EmptyStateProps {
  icon?: IconName
  title?: string
  description?: string
  spin?: boolean
}

// --- Table ---
export interface TableProps<T = Record<string, unknown>> {
  /** カラム定義配列 */
  columns: TableColumn<T>[]
  /** 描画するデータ配列 */
  data?: T[]
  /** ソート対象キー（v-model:sortBy 対応） */
  sortBy?: string
  /** ソート方向（v-model:sortOrder 対応） */
  sortOrder?: TableSortOrder
  /** 行識別子（キー）の解決プロパティ名または関数 */
  rowKey?: string | ((row: T) => string | number)
  /** 各行（tr）のカスタムクラス解決関数 */
  rowClass?: (row: T, index: number) => string | Record<string, boolean | undefined> | (string | Record<string, boolean | undefined>)[] | undefined
  /** 各行（tr）の HTML id 解決関数 */
  rowId?: (row: T, index: number) => string
  /** データが0件の時の表示文言 */
  emptyText?: string
  /** ローディング状態フラグ */
  loading?: boolean
  /** ローディング時の表示文言 */
  loadingText?: string
  /** 行クリックのインタラクション（ホバー・アクティブ演出）を有効にするか */
  interactiveRow?: boolean
}

// --- Alert ---
export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps {
  variant?: AlertVariant
  icon?: IconName
  title?: string
  /** 本文テキスト（スロット未指定時に表示） */
  text?: string
}

// ============================================================================
// 4. Organisms（構造化コンポーネント）
// ============================================================================

export interface GlobalNavProps {
  menuData?: import('~/constants/data/menuData').MenuSection[]
}

export interface ModalProps {
  title?: string
  icon?: IconName
  align?: 'left' | 'center'
  closeText?: string
}
