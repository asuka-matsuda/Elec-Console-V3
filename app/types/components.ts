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
  to?: string
  disabled?: boolean
}

export interface BreadcrumbsProps {
  /** パンくずリスト項目配列 */
  items?: BreadcrumbItem[]
  /** セパレーター（文字列指定時。未指定時は chevron-right アイコン） */
  separator?: string
  /** 末尾アイテムのコンソールカーソル点滅演出 (デフォルト: true) */
  cursor?: boolean
}

// ============================================================================
// 2. Atoms（最小構成要素）
// ============================================================================

// --- Button ---
export type ButtonVariant
  = 'primary'
    | 'secondary'
    | 'tertiary'
    | 'danger'
    | 'warning'

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  /** リンク先パス (指定時は NuxtLink として描画) */
  to?: string
  /** HTML type 属性 */
  type?: 'button' | 'submit' | 'reset'
  /** カラーバリアント (Geist準拠: primary / secondary / tertiary / danger / warning) */
  variant?: ButtonVariant
  /** ボタンサイズ (Geist準拠: sm / md / lg) */
  size?: ButtonSize
  /** 無効化フラグ */
  disabled?: boolean
  /** ローディング状態フラグ */
  loading?: boolean
  /** 前置アイコン名 */
  icon?: IconName
  /** 後置アイコン名 (Geist準拠) */
  suffixIcon?: IconName
  /** 横幅100%（全幅）表示フラグ */
  block?: boolean
}

// --- Avatar ---
export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps {
  /** アバター画像 URL */
  src?: string
  /** 画像代替テキスト */
  alt?: string
  /** 表示テキストまたはイニシャル（1〜2文字、画像が無い場合のフォールバック） */
  text?: string
  /** サイズ ('sm' = 24px, 'md' = 32px [デフォルト], 'lg' = 40px) */
  size?: AvatarSize
}

// --- Badge ---
export type BadgeVariant
  = | 'gray'
    | 'blue'
    | 'purple'
    | 'amber'
    | 'red'
    | 'pink'
    | 'green'
    | 'teal'
    | 'inverted'
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'accent'
    | 'neutral'

export type BadgeContrast = 'high' | 'low'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps {
  /** カラーバリアント (Geist準拠) */
  variant?: BadgeVariant
  /** コントラスト ('high' = 通常, 'low' = サブトル/淡い背景) */
  contrast?: BadgeContrast
  /** サイズ */
  size?: BadgeSize
  /** 前置アイコン名 */
  icon?: IconName
}

// --- Checkbox (Geist準拠) ---
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
  /** 不確定（中間・部分選択）状態。true の場合、チェックマークではなく水平バー（minusアイコン）を表示 */
  indeterminate?: boolean
  /** カテゴリカラー等のカスタム色指定 */
  color?: string
  /** ホバーツールチップテキスト */
  title?: string
}

// --- Icon ---
export type IconSize = 'sm' | 'md' | 'lg'
export type IconVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted'

export interface IconProps {
  name: IconName
  size?: IconSize
  variant?: IconVariant
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

// --- Input (Geist準拠) ---
export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps {
  /** HTML id属性 */
  id?: string
  /** フォーム名属性 */
  name?: string
  /** 入力タイプ (デフォルト: 'text') */
  type?: InputType
  /** プレースホルダー */
  placeholder?: string
  /** サイズ ('sm' = 32px, 'md' = 40px [デフォルト], 'lg' = 48px) */
  size?: InputSize
  /** 無効化状態 (デフォルト: false) */
  disabled?: boolean
  /** 読み取り専用状態 (デフォルト: false) */
  readonly?: boolean
  /** エラー状態フラグ (デフォルト: false) */
  error?: boolean
  /** 前置アイコン名 */
  icon?: IconName
  /** 後置アイコン名 */
  suffixIcon?: IconName
  /** 前置テキストラベル (例: 'https://') */
  prefix?: string
  /** 後置テキストラベル (例: '.com') */
  suffix?: string
  /** 入力値の末尾空白自動トリム (デフォルト: true) */
  trim?: boolean
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
  /** ホバーツールチップテキスト */
  title?: string
}

// --- Clearable Input (Geist準拠) ---
export interface ClearableInputProps extends InputProps {
  /** クリアボタンのツールチップテキスト */
  clearTitle?: string
}

// --- Select (Geist準拠) ---
export type SelectSize = 'sm' | 'md' | 'lg'

export interface SelectProps<T = string | number | boolean> {
  /** 選択肢リスト */
  options?: SelectOption<T>[]
  /** プレースホルダー (例: 'フレームワークを選択') */
  placeholder?: string
  /** サイズ ('sm' = 32px, 'md' = 40px [デフォルト], 'lg' = 48px) */
  size?: SelectSize
  /** 前置アイコン名 */
  icon?: IconName
  /** 前置テキストラベル */
  prefix?: string
  /** 横幅100%（全幅）表示フラグ */
  block?: boolean
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

// --- Skeleton ---
export type SkeletonElement = 'span' | 'div'

export interface SkeletonProps {
  /** 幅（CSS値 例: '100%', '120px', '4rem'） */
  width?: string
  /** 高さ（CSS値 例: '1em', '40px'） */
  height?: string
  /** 真円フラグ（アバターや円形アイコン用） */
  circle?: boolean
  /** 描画するHTML要素タグ（デフォルト: 'span'） */
  as?: SkeletonElement
}

// --- Switch ---
export interface SwitchProps {
  /** HTML id属性（未指定時は自動生成） */
  id?: string
  /** フォーム名属性 */
  name?: string
  /** ラベルテキスト */
  label?: string
  /** 無効化フラグ */
  disabled?: boolean
  /** ローディング中フラグ */
  loading?: boolean
  /** ホバーツールチップテキスト */
  title?: string
}

// --- Tooltip ---
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  /** ツールチップに表示するテキスト */
  text: string
  /** 表示位置 (デフォルト: 'top') */
  placement?: TooltipPlacement
  /** 無効化フラグ */
  disabled?: boolean
}

// --- Table ---
export type TableSortOrder = 'asc' | 'desc' | null

// ============================================================================
// 3. Molecules（複合コンポーネント）
// ============================================================================

// --- Toast ---
export type ToastType = 'info' | 'success' | 'warning' | 'danger'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  /** 表示時間（ミリ秒。デフォルト: 3500ms） */
  duration?: number
}

// --- DropdownMenu ---
export interface DropdownMenuItem {
  label: string
  icon?: IconName
  variant?: 'secondary' | 'danger'
  disabled?: boolean
  action: () => void | Promise<void>
}

export interface DropdownMenuProps {
  /** メニュー項目一覧 */
  items?: DropdownMenuItem[]
  /** トリガーアイコン（デフォルト: 'more-vertical'） */
  icon?: IconName
  /** トリガーボタンラベル（未指定時はアイコンのみ） */
  label?: string
  /** トリガーボタンバリアント（デフォルト: 'secondary'） */
  variant?: ButtonVariant
  /** 無効化フラグ */
  disabled?: boolean
}

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
  /** ローディング時の表示文言 (スロット使用時等) */
  loadingText?: string
  /** ローディング時に描画するスケルトン行数 (デフォルト: 5) */
  skeletonRows?: number
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

// --- Banner ---
export type BannerVariant = 'gray' | 'warning' | 'success' | 'danger'

export interface BannerProps {
  /** バリアント (Geist準拠: 'gray' | 'warning' | 'success' | 'danger') */
  variant?: BannerVariant
  /** アイコン名 (未指定時はバリアントに応じたデフォルトアイコン) */
  icon?: IconName
  /** タイトルテキスト */
  title?: string
  /** サブテキスト・補足説明 */
  sub?: string
  /** 閉じるボタンを表示するかどうか */
  dismissible?: boolean
}

// --- Calendar (Geist準拠 日付・期間選択ピッカー) ---
export type CalendarMode = 'single' | 'range'
export type CalendarSize = 'sm' | 'md'

export interface DateRange {
  start: string | null
  end: string | null
}

export interface CalendarPreset {
  label: string
  /** プリセット値（YYYY-MM-DD または DateRange オブジェクト） */
  range: DateRange | string
}

export interface CalendarProps {
  /** 選択モード (Geist準拠: 'single' | 'range'、デフォルト: 'single') */
  mode?: CalendarMode
  /** サイズ展開 (Geist準拠: 'sm' | 'md'、デフォルト: 'md') */
  size?: CalendarSize
  /** 選択可能な最小日付 (YYYY-MM-DD) */
  min?: string
  /** 選択可能な最大日付 (YYYY-MM-DD) */
  max?: string
  /** プリセット選択肢（主に range モードで使用） */
  presets?: CalendarPreset[]
  /** プリセットの配置レイアウト (Geist準拠: 'horizontal' | 'stacked'、デフォルト: 'horizontal') */
  layout?: 'horizontal' | 'stacked'
  /** コンポーネント全体の無効化フラグ */
  disabled?: boolean
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
