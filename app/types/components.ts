export interface BaseButtonProps {
  to?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
  size?: 'sm' | 'md'
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  block?: boolean
  disabled?: boolean
}
