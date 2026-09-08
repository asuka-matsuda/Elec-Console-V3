import type { RadioOption, SelectOption } from '~/types/components'

/**
 * 汎用的なトグル（あり / なし）
 */
export const TOGGLE_OPTIONS: RadioOption[] = [
  { label: 'あり', value: 'yes' },
  { label: 'なし', value: 'no' },
]

/**
 * 状態判定（良 / 不良 / 無）
 */
export const PHASE_STATUS_OPTIONS: RadioOption[] = [
  { label: '良', value: 'good', color: 'var(--color-status-success)' },
  { label: '不良', value: 'bad', color: 'var(--color-status-danger)' },
  { label: '無', value: 'none', color: 'var(--color-status-neutral)' },
]

/**
 * 計算モード（Drop / Size など）
 */
export const CALC_MODE_OPTIONS: RadioOption[] = [
  { label: 'Drop', value: 'drop' },
  { label: 'Size', value: 'size' },
]

/**
 * テーマ選択肢（ダークモード / ライトモード）
 */
export const THEME_OPTIONS: SelectOption<string>[] = [
  { label: 'ダークモード (標準)', value: 'dark' },
  { label: 'ライトモード', value: 'light' },
]

/**
 * ログインフォーム 入力フィールド定義
 */
export const LOGIN_FORM_FIELDS = [
  { id: 'userId', label: 'ユーザーID', type: 'text', placeholder: 'master' },
  {
    id: 'password',
    label: 'パスワード',
    type: 'password',
    placeholder: '••••••••',
  },
] as const
