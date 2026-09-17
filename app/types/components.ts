import type { ComputedRef, InjectionKey } from 'vue'

import type { BadgePresetId } from '~/constants/badgeConfig'
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
export type TabOption<V = string | number> = {
  label: string
  value: V
  disabled?: boolean
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
export type AtomsButtonProps = ButtonProps

// --- Checkbox ---
export interface CheckboxProps {
  value?: unknown
  label?: string
  disabled?: boolean
  indeterminate?: boolean
  trueValue?: unknown
  falseValue?: unknown
}
export type AtomsCheckboxProps = CheckboxProps

// --- Icon ---
export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export interface IconProps {
  name: IconName
  size?: IconSize
  strokeWidth?: number | string
  spin?: boolean
}
export type AtomsIconProps = IconProps

// --- Badge ---
export type BadgeColor = string

export interface BadgeProps {
  /** プリセット定義ID（例: 'role:admin', 'site:completed' 等） */
  id?: BadgePresetId
  /** バッジの基調色（直接指定する場合） */
  color?: BadgeColor
}
export type AtomsBadgeProps = BadgeProps

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
export type AtomsDividerProps = DividerProps

// --- Panel ---
export type PanelOverflow = 'hidden' | 'visible' | 'auto'

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
}
export type AtomsPanelProps = PanelProps

// --- Disclaimer ---
export interface DisclaimerProps {
  /** 免責・注記本文（スロットで差し替えも可能） */
  text?: string
}
export type AtomsDisclaimerProps = DisclaimerProps

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
}
export type AtomsInputProps = InputProps

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
export type AtomsSelectProps<T = string | number | boolean> = SelectProps<T>

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
export type AtomsFormControlActionProps = FormControlActionProps

// ============================================================================
// 3. Molecules（複合コンポーネント）
// ============================================================================

// --- ResultBox & ResultDetails ---
export type ResultBoxStatus = 'success' | 'warning' | 'danger' | 'error' | 'default' | 'neutral' | 'empty'

export interface ResultDetailItem {
  label: string
  value: string | number
  unit?: string
  note?: string
  topBorder?: boolean
}

// --- InfoCard ---
export interface InfoCardItem {
  id?: string | number
  date: string
  title: string
  desc?: string
}

export interface MoleculesInfoCardProps<T extends InfoCardItem = InfoCardItem> {
  items?: T[]
  pending?: boolean
  loadingText?: string
  emptyText?: string
  maxCount?: number
}

// ============================================================================
// 4. Organisms（構造化コンポーネント）
// ============================================================================

export interface OrganismsFooterProps {
  year?: number | string
  text?: string
}

export interface OrganismsGlobalNavProps {
  menuData: import('~/constants/data/menuData').MenuSection[]
}

// ============================================================================
// 5. Templates（画面レイアウトテンプレート）
// ============================================================================

export interface ToolTemplatesLayoutProps {
  inputsTitle?: string
  inputsIcon?: string
  resultsTitle?: string
  resultsIcon?: string
  saveDisabled?: boolean
  saveFunction?: () => Promise<void>
  disclaimerText?: string
  hideDisclaimer?: boolean
}

// ============================================================================
// 6. フォーム共通コンテキスト（Form Context Injection）
// ============================================================================

export interface FormGroupContext {
  id: ComputedRef<string>
  hasError: ComputedRef<boolean>
}

export const FORM_GROUP_KEY: InjectionKey<FormGroupContext> = Symbol('FormGroupContext')
