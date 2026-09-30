/**
 * UI コンポーネント共通型定義
 *
 * ボタン、フォーム入力、モーダル、テーブルカラム等の共通 Props / Emits インターフェースを定義します。
 */

import type { ComputedRef } from 'vue'

import type { MenuItem } from '~/constants/data/menuData'
import type { HelpId } from '~/constants/helpConstants'
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
  /** 列幅自動計算用ウェイト（重み） */
  flexWeight?: number
  /** 固定幅フラグ（false の場合は自動伸縮対象） */
  fixedWidth?: boolean
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
}

// --- Checkbox ---
export interface CheckboxProps {
  /** チェックボックスの値（配列 v-model 時に使用） */
  value?: unknown
  /** ラベルテキスト */
  label?: string
  /** 無効化フラグ */
  disabled?: boolean
  /**
   * バリアント（未指定時は default = 選択用）
   * - default: 通常の選択・トグル（テーマアクセント色）
   * - success: タスク完了・検査確認（グリーン）
   */
  variant?: 'default' | 'success'
  /** カテゴリカラー等のカスタム色指定 */
  color?: string
}

// --- Icon ---
type IconSize = 'sm' | 'md' | 'lg'

export interface IconProps {
  name: IconName
  size?: IconSize
  spin?: boolean
}

// --- Badge ---
export interface BadgeProps {
  /** バッジの発光色（CSS変数またはカラー値。未指定時は muted） */
  color?: string
}

// --- Divider ---
export type DividerType = 'fade-side' | 'fade-center' | 'solid'
export type DividerOrientation = 'horizontal' | 'vertical'

export interface DividerProps {
  /** 線のスタイル種別（デフォルト: 'fade-side'） */
  type?: DividerType
  /** 線の向き（デフォルト: 'horizontal'） */
  orientation?: DividerOrientation
  /** 線の基調色（CSSカラー値またはCSS変数。未指定時は現在のカテゴリカラーが自動適用） */
  color?: string
}

// --- Heading ---
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6 | '1' | '2' | '3' | '4' | '5' | '6' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
export type HeadingSize = '3xl' | '2xl' | 'xl' | 'lg' | 'base'

export interface HeadingProps {
  /** 出力する見出しタグまたはレベル（1〜6 または h1〜h6。デフォルト: 2） */
  level?: HeadingLevel
  /** 出力する見出しタグ（level のエイリアス。h1〜h6 以外の div, p, span 等も可） */
  tag?: HeadingLevel | string
  /** 視覚サイズ（未指定時は level に応じて自動決定） */
  size?: HeadingSize
}

// --- SectionHeader ---
type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
type SectionHeaderVariant = 'main' | 'border' | 'hud'

export interface SectionHeaderProps {
  /** セクションのタイトル文字列（スロットでの指定も可能） */
  title?: string
  /** レンダリングする見出しタグ（h1〜h6。デフォルト: 'h2'） */
  tag?: HeadingTag
  /** 見出し左側に表示するアイコン名 */
  icon?: IconName
  /** 区切り線のスタイルバリアント（デフォルト: 'main'） */
  variant?: SectionHeaderVariant
}

// --- Panel ---
export type PanelPadding = 'normal' | 'compact' | 'none'

export interface PanelProps {
  /** 描画するHTML要素またはコンポーネント（デフォルト: 'div'） */
  as?: string | object
  /** 内側パディング（デフォルト: 'normal' = p-panel-pad, 'compact' = p-panel-pad-compact, 'none' = パディングなし） */
  padding?: PanelPadding
  /** 操作可能状態（ホバー・アクティブ演出） */
  interactive?: boolean
  /** アクティブ・選択状態（アクセントハイライト） */
  active?: boolean
  /** 無効状態（半透明・操作不可） */
  disabled?: boolean
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

export interface InputProps {
  /** HTML id属性 */
  id?: string
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
}

// --- Textarea ---
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both'

export interface TextareaProps {
  /** HTML id属性 */
  id?: string
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
}

// --- RadioGroup ---
export interface RadioGroupProps<T = string | number | boolean> {
  /** 選択肢一覧 */
  options: RadioOption<T>[]
  /** グループ全体の無効化 (デフォルト: false) */
  disabled?: boolean
  /** 幅いっぱいに均等配置（全幅モード、デフォルト: false） */
  block?: boolean
}

// --- Table ---
export type TableSortOrder = 'asc' | 'desc' | null

// ============================================================================
// 3. Molecules（複合コンポーネント）
// ============================================================================

// --- Tabs ---
export interface TabsProps<T = string | number> {
  /** タブ選択肢一覧 */
  options: TabOption<T>[]
  /** パネル領域のカスタムクラス */
  panelClass?: string
  /** タブ切り替え時にパネル状態をメモリ上に保持するかどうか */
  keepAlive?: boolean
}

// --- ResultTile & ResultDetails ---
export type ResultTileStatus = 'neutral' | 'success' | 'warning' | 'danger' | 'empty'
export type ResultPanelStatus = ResultTileStatus

export interface ResultTileProps {
  title?: string
  status?: ResultTileStatus
  badge?: string
  isEmpty?: boolean
  size?: 'sm' | 'md'
}
export type ResultPanelProps = ResultTileProps

export interface ResultDetailItem {
  label: string
  value: string | number
  unit?: string
  note?: string
}

// --- InfoList ---
export interface InfoListItem {
  id?: string | number
  date: string
  title: string
}

export interface InfoListProps<T extends InfoListItem = InfoListItem> {
  items?: T[]
  pending?: boolean
  loadingText?: string
  emptyText?: string
}

// --- MenuTile (Dashboard) ---
export interface MenuTileProps {
  /** メニューアイテムオブジェクト（タイトル・アイコン・リンク・無効状態・説明文） */
  item: MenuItem
}

// --- KanaFilter (Reference) ---
export interface KanaFilterProps {
  availableRows?: Set<string>
}

// --- EmptyState ---
export interface EmptyStateProps {
  icon?: IconName
  title?: string
  description?: string
  spin?: boolean
}

// --- HelpTip ---
export interface HelpTipProps {
  /** 規格ヘルプID（省略時は text のみ表示） */
  helpId?: HelpId
  /** 表示テキスト（省略時は helpId のデフォルト解説文） */
  text?: string
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

// --- Breadcrumb ---
export interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  separator?: string
  showCursor?: boolean
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

export interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[]
}

export interface FooterProps {
  year?: number | string
  text?: string
}

export interface GlobalNavProps {
  menuData?: import('~/constants/data/menuData').MenuSection[]
}

export interface FilterPanelProps {
  title?: string
  tag?: HeadingTag
  icon?: IconName
  placeholder?: string
  categoryOptions?: SelectOption<string>[]
}

export interface ModalProps {
  title?: string
  icon?: IconName
  align?: 'left' | 'center'
  closeText?: string
}

// ============================================================================
// 5. Templates（画面レイアウトテンプレート）
// ============================================================================

export interface ToolCalculatorLayoutProps {
  inputsTitle?: string
  inputsIcon?: IconName
  resultsTitle?: string
  resultsIcon?: IconName
  saveDisabled?: boolean
  saveFunction?: () => Promise<void>
  disclaimerText?: string
  hideDisclaimer?: boolean
}

// ============================================================================
// 6. フォーム共通コンテキスト（Form Context Injection & Props）
// ============================================================================

export interface FormGroupProps {
  id?: string
  label?: string
  required?: boolean
  error?: string
  help?: string
  helpId?: HelpId
  /** 末尾に付与する単位テキスト */
  addon?: string
}

export interface FormGroupContext {
  id: ComputedRef<string>
  hasError: ComputedRef<boolean>
}
