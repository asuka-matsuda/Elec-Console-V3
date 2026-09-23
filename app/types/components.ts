/**
 * UI コンポーネント共通型定義
 *
 * ボタン、フォーム入力、モーダル、テーブルカラム等の共通 Props / Emits インターフェースを定義します。
 */

import type { ComputedRef, InjectionKey } from 'vue'

import type { BadgePresetId } from '~/constants/badgeConfig'
import type { MenuItem } from '~/constants/data/menuData'
import type { HelpId } from '~/constants/helpConstants'
import type { IconName } from '~/constants/icons'

export type { BadgePresetId }

// ============================================================================
// 1. 共通UIデータ型 & 選択肢オプション型 (Common Options & Table / Nav)
// ============================================================================

/** 汎用セレクトボックス用選択肢 */
export interface SelectOption<T = string | number | boolean> {
  label: string
  value: T
  disabled?: boolean
}

/** 汎用ラジオボタングループ用選択肢 */
export interface RadioOption<T = string | number | boolean> {
  label: string
  value: T
  disabled?: boolean
  color?: string
}

/** 汎用タブ選択肢 */
export interface TabOption<V = string | number> {
  label: string
  value: V
  disabled?: boolean
  /** タブ左側に表示するアイコン（任意） */
  icon?: IconName
  /** タブ右側に表示するバッジ（任意） */
  badge?: string | number
  /** バッジのバリアント */
  badgeVariant?: BadgePresetId
}

/** 汎用テーブルカラム定義 */
export interface TableColumn<T = Record<string, unknown>> {
  key: (keyof T & string) | string
  subKey?: (keyof T & string) | string
  label: string
  sortable?: boolean
  width?: string
  minWidth?: string
  maxWidth?: string
  fixedWidth?: boolean
  align?: 'left' | 'center' | 'right'
  /** この列でテキスト省略（...）を行うかどうか */
  truncate?: boolean
  /** 値が空（null, undefined, 空文字）の時のフォールバック表示 */
  emptyFallback?: string
  /** セルに適用する追加クラス */
  class?: string
  /** 表示値のカスタムフォーマッタ関数 */
  format?: (value: unknown, row: T) => unknown
}

/** パンくずリスト項目 */
export interface BreadcrumbItem {
  text: string
}

/** システムお知らせ用アイテム定義 */
export interface AnnouncementItem {
  id?: number | string
  title: string
  date: string
  desc: string
}

/** システム更新履歴・リリースノート用アイテム定義 */
export interface HistoryItem {
  id?: number | string
  version: string
  title: string
  date: string
  desc: string
  status?: string
}

/** 改行禁止ワード設定用アイテム定義 */
export interface WordBreakItem {
  id?: string | number
  word: string
  date: string
}

/** ダッシュボード用集約データ */
export interface DashboardData {
  announcements: AnnouncementItem[]
  history: HistoryItem[]
}

// ============================================================================
// 2. Atoms（最小構成要素）
// ============================================================================

// --- Button ---
export type ButtonVariant = 'default' | 'success' | 'danger'

export interface BaseButtonProps {
  to?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
  block?: boolean
  disabled?: boolean
  title?: string
}

export interface ButtonProps extends BaseButtonProps {
  icon?: IconName
  iconRight?: IconName
  iconOnly?: boolean
  loading?: boolean
}

// --- Checkbox ---
export interface CheckboxProps {
  value?: unknown
  label?: string
  disabled?: boolean
  indeterminate?: boolean
  trueValue?: unknown
  falseValue?: unknown
}

// --- Icon ---
export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export interface IconProps {
  name: IconName
  size?: IconSize
  strokeWidth?: number | string
  spin?: boolean
}

// --- Badge ---
export type BadgeColor = string

export interface BadgeProps {
  /** プリセット定義ID（例: 'role:admin', 'site:completed' 等） */
  id?: BadgePresetId
  /** バッジの基調色（直接指定する場合） */
  color?: BadgeColor
}

// --- Divider ---
export type DividerType = 'solid' | 'fade-center' | 'fade-side'
export type DividerOrientation = 'horizontal' | 'vertical'

export interface DividerProps {
  /** 線の基調色（CSSカラー値またはCSS変数。デフォルト: var(--theme-accent)） */
  color?: string
  /** 線のスタイル種別（デフォルト: 'solid'） */
  type?: DividerType
  /** 線の向き（デフォルト: 'horizontal'） */
  orientation?: DividerOrientation
  /** アニメーション（スケール演出・パルス光）を有効にするか（デフォルト: true） */
  animated?: boolean
}

// --- SectionHeader ---
export type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
export type SectionHeaderVariant = 'main' | 'border' | 'hud'

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
export type PanelOverflow = 'hidden' | 'visible' | 'auto'
export type PanelPadding = 'normal' | 'none' | 'sm'

export interface PanelProps {
  /** 描画するHTML要素またはコンポーネント（デフォルト: 'div'） */
  as?: string | object
  /** 操作可能状態（ホバー・アクティブ演出） */
  interactive?: boolean
  /** 選択状態（アクセントグラデーション・グロー） */
  selected?: boolean
  /** 無効状態（半透明・操作不可） */
  disabled?: boolean
  /** オーバーフロー制御（デフォルト: 'hidden'） */
  overflow?: PanelOverflow
  /** 内側パディング（デフォルト: 'normal' = p-panel-pad, 'none' = パディングなし, 'sm' = p-2） */
  padding?: PanelPadding
}

// --- Disclaimer ---
export interface DisclaimerProps {
  /** 免責・注記本文 */
  text?: string
}
export type ToolDisclaimerProps = DisclaimerProps

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

export type InputMode = 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'

export interface InputProps {
  /** 入力タイプ (デフォルト: 'text') */
  type?: InputType
  /** プレースホルダー */
  placeholder?: string
  /** 無効化状態 (デフォルト: false) */
  disabled?: boolean
  /** 読み取り専用 (デフォルト: false) */
  readonly?: boolean
  /** エラー状態フラグ (デフォルト: false) */
  error?: boolean
  /** 必須入力 (デフォルト: false) */
  required?: boolean
  /** 最小値 (type="number" / "date" 等) */
  min?: number | string
  /** 最大値 (type="number" / "date" 等) */
  max?: number | string
  /** 増減ステップ (type="number" 等) */
  step?: number | string
  /** 最大文字数 */
  maxlength?: number
  /** HTML id属性 */
  id?: string
  /** HTML name属性 */
  name?: string
  /** 自動補完 */
  autocomplete?: string
  /** 入力モード (モバイルキーボード最適化) */
  inputmode?: InputMode
  /** 入力クリアボタンを表示する (デフォルト: true) */
  clearable?: boolean
  /** type="password" 時に表示/非表示トグルボタンを有効化する (デフォルト: true) */
  passwordToggle?: boolean
  /** 末尾に付与する単位テキスト（または #addon スロット） */
  addon?: string
}

// --- Select ---
export interface SelectProps<T = string | number | boolean> {
  /** 選択肢リスト */
  options: SelectOption<T>[]
  /** プレースホルダー */
  placeholder?: string
  /** 無効化状態 (デフォルト: false) */
  disabled?: boolean
  /** エラー状態フラグ (デフォルト: false) */
  error?: boolean
  /** HTML id属性 */
  id?: string
  /** ドロップダウンの展開方向優先設定 */
  placement?: 'top' | 'bottom'
  /** 選択解除（クリア）ボタンを表示する (デフォルト: true) */
  clearable?: boolean
}

// --- Textarea ---
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both'

export interface TextareaProps {
  /** プレースホルダー */
  placeholder?: string
  /** 無効化状態 (デフォルト: false) */
  disabled?: boolean
  /** 読み取り専用 (デフォルト: false) */
  readonly?: boolean
  /** エラー状態フラグ (デフォルト: false) */
  error?: boolean
  /** 必須入力 (デフォルト: false) */
  required?: boolean
  /** 表示行数 (デフォルト: 4) */
  rows?: number
  /** 最大文字数 */
  maxlength?: number
  /** リサイズ方向の制御 (デフォルト: 'vertical') */
  resize?: TextareaResize
  /** HTML id属性 */
  id?: string
  /** HTML name属性 */
  name?: string
  /** 自動補完 */
  autocomplete?: string
}

// --- FormControlAction ---
export interface FormControlActionProps {
  /** 表示するアイコン名 */
  icon: IconName
  /** ツールチップ用タイトル */
  title?: string
  /** 180度回転状態（セレクトボックス展開矢印等） */
  rotate?: boolean
  /** 操作可能か（false の場合は単なるインジケーターとして表示） */
  interactive?: boolean
  /** 無効化状態 */
  disabled?: boolean
  /** フォーカス用 tabindex (デフォルト: -1) */
  tabindex?: number
}

// --- RadioGroup ---
export interface RadioGroupProps<T = string | number | boolean> {
  /** 選択肢一覧 */
  options: RadioOption<T>[]
  /** フォーム識別用 name 属性 */
  name?: string
  /** グループ全体の無効化 (デフォルト: false) */
  disabled?: boolean
  /** 幅いっぱいに均等配置（全幅モード、デフォルト: false） */
  block?: boolean
}

// --- TableTh ---
export type TableSortOrder = 'asc' | 'desc' | null

export interface TableThProps<RowType = Record<string, unknown>> {
  /** カラム定義 */
  column: TableColumn<RowType>
  /** 現在アクティブなソートキー */
  sortBy?: string
  /** 現在のソート順序 */
  sortOrder?: TableSortOrder
  /** ツールチップテキスト（任意） */
  title?: string
}

// --- TableTd ---
export interface TableTdProps {
  /** メイン表示値 */
  value?: unknown
  /** サブ表示値（2段組時） */
  subValue?: unknown
  /** 水平配置（デフォルト: 'left'） */
  align?: 'left' | 'center' | 'right'
  /** 省略記号（...）表示を有効にするか（未指定時は通常セルで自動有効） */
  truncate?: boolean
  /** 値が空（null, undefined, 空文字）の場合のフォールバック表示 */
  emptyFallback?: string
  /** ツールチップ（未指定時は省略表示時にメインテキストを自動付与） */
  title?: string
}

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

// --- ResultPanel & ResultDetails ---
export type ResultPanelStatus = 'neutral' | 'success' | 'warning' | 'danger' | 'empty'

export interface ResultPanelProps {
  title?: string
  status?: ResultPanelStatus
  badge?: string
  isEmpty?: boolean
  size?: 'sm' | 'md'
}

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
export type DashboardMenuTileProps = MenuTileProps

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
export type MoleculesHelpTipProps = HelpTipProps

// --- Table ---
export interface TableProps<T = Record<string, unknown>> {
  /** カラム定義配列 */
  columns: TableColumn<T>[]
  /** 描画するデータ配列 */
  data?: T[]
  /** 列幅自動計算のサンプリング用全件データ（ページング時等） */
  fullData?: T[]
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
  /** 列幅の自動最適化を有効にするか（デフォルト: true） */
  autoWidth?: boolean
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
}

// ============================================================================
// 4. Organisms（構造化コンポーネント）
// ============================================================================

export interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[]
}

export type OrganismsHeaderProps = HeaderProps

export interface FooterProps {
  year?: number | string
  text?: string
}

export type OrganismsFooterProps = FooterProps

export interface GlobalNavProps {
  menuData?: import('~/constants/data/menuData').MenuSection[]
}

export type OrganismsGlobalNavProps = GlobalNavProps

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
  inputsIcon?: string
  resultsTitle?: string
  resultsIcon?: string
  saveDisabled?: boolean
  saveFunction?: () => Promise<void>
  disclaimerText?: string
  hideDisclaimer?: boolean
}

export type ToolTemplatesLayoutProps = ToolCalculatorLayoutProps

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
}

export interface FormGroupContext {
  id: ComputedRef<string>
  hasError: ComputedRef<boolean>
}

export const FORM_GROUP_KEY: InjectionKey<FormGroupContext> = Symbol('FormGroupContext')
