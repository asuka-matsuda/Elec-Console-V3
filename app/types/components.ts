export type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'success'

export interface BaseButtonProps {
  to?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
  size?: 'sm' | 'md'
  variant?: AppButtonVariant
  block?: boolean
  disabled?: boolean
}

export interface AppButtonProps extends BaseButtonProps {
  icon?: string
  iconRight?: string
  iconOnly?: boolean
  loading?: boolean
}

export interface AppIconButtonProps extends BaseButtonProps {
  name: string
  label?: string
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
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface BreadcrumbItem {
  text: string
  href?: string
}

export type BadgePresetColor
  = | 'secondary'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'tool'
    | 'portal'
    | 'database'
    | 'reference'
    | 'neutral'

export type BadgeColor = BadgePresetColor | (string & {})

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
