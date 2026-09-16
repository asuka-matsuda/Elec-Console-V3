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

export type AtomsCheckboxProps = CheckboxProps
