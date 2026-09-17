import type { BadgePresetId } from '~/constants/badgeConfig'
import type { IconName } from '~/constants/icons'

export type { BadgePresetId }

export type ButtonVariant = 'default' | 'success' | 'danger'

export type ResultBoxStatus = 'success' | 'warning' | 'danger' | 'error' | 'default' | 'neutral' | 'empty'

export interface ResultDetailItem {
  label: string
  value: string | number
  unit?: string
  note?: string
  topBorder?: boolean
}

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

export interface SelectOption<T = string | number | boolean> {
  label: string
  value: T
  disabled?: boolean
}

export interface RadioOption<T = string | number | boolean> {
  label: string
  value: T
  disabled?: boolean
  color?: string
}

export type TabOption<V = string | number> = {
  label: string
  value: V
  disabled?: boolean
}

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

export interface BreadcrumbItem {
  text: string
}

export type BadgeColor = string

export interface BadgeProps {
  /** プリセット定義ID（例: 'role:admin', 'site:completed' 等） */
  id?: BadgePresetId
  /** バッジの基調色（直接指定する場合） */
  color?: BadgeColor
}

export interface AnnouncementItem {
  id?: number | string
  title: string
  date: string
  desc: string
}

/**
 * システム更新履歴・リリースノート用アイテム定義（ダッシュボード等で表示）
 */
export interface HistoryItem {
  id?: number | string
  version: string
  title: string
  date: string
  desc: string
  status?: string
}

export interface DashboardData {
  announcements: AnnouncementItem[]
  history: HistoryItem[]
}

export interface OrganismsFooterProps {
  year?: number | string
  text?: string
}

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

export interface OrganismsGlobalNavProps {
  menuData: import('~/constants/data/menuData').MenuSection[]
}

export interface CheckboxProps {
  value?: unknown
  label?: string
  disabled?: boolean
  indeterminate?: boolean
  trueValue?: unknown
  falseValue?: unknown
}

export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export interface IconProps {
  name: IconName
  size?: IconSize
  strokeWidth?: number | string
  spin?: boolean
}

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

/** 後方互換性エイリアス */
export type AtomsDividerProps = DividerProps

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

/** 後方互換性エイリアス */
export type AtomsPanelProps = PanelProps
