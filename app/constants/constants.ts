/**
 * アプリケーション共通定数定義
 *
 * テーマモード選択肢、現場ステータス一覧、ロール定義等の共通定数を提供します。
 */

import type { SelectOption } from '~/types/components'

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
