/**
 * 管理画面共通定数定義
 *
 * ユーザー管理、現場管理等の管理画面入力フィールドおよび選択肢設定を提供します。
 */

import type { UserRole } from '#shared/types/auth'
import type { SiteStatus } from '#shared/types/site'
import type { SelectOption } from '~/types/components'

/**
 * ユーザー権限（ロール）選択肢
 */
export const USER_ROLE_OPTIONS: SelectOption<UserRole>[] = [
  { value: 'admin', label: '管理者 (admin)' },
  { value: 'worker', label: '作業者 (worker)' },
  { value: 'viewer', label: '閲覧者 (viewer)' },
]

/**
 * ユーザー新規登録 入力フィールド定義
 */
export const USER_CREATE_FORM_FIELDS = [
  { id: 'loginId', label: 'ログインID', placeholder: '例: EMP001' },
  { id: 'lastName', label: '姓', placeholder: '例: 松田' },
  { id: 'lastNameKana', label: '姓（ふりがな）', placeholder: '例: まつだ' },
  { id: 'firstName', label: '名', placeholder: '例: 飛鳥' },
  { id: 'firstNameKana', label: '名（ふりがな）', placeholder: '例: あすか' },
] as const

/**
 * 現場ステータス選択肢
 */
export const SITE_STATUS_OPTIONS: SelectOption<SiteStatus>[] = [
  { label: '計画中', value: 'planning' },
  { label: '進行中', value: 'in_progress' },
  { label: '完了', value: 'completed' },
  { label: '保留', value: 'on_hold' },
]

/**
 * 現場詳細設定 タブ定義
 */
export const SITE_SETTINGS_TABS = [
  { value: 'basic', label: '基本情報', icon: 'info' },
  { value: 'integration', label: 'Excelデータ連携', icon: 'link' },
  { value: 'rules', label: '除外回路ルール', icon: 'filter' },
  { value: 'wordBreak', label: '改行禁止ワード', icon: 'type' },
]

/**
 * ユーザー詳細設定 タブ定義
 */
export const USER_SETTINGS_TABS = [
  { value: 'basic', label: '基本情報', icon: 'user' },
  { value: 'assign', label: '現場アサイン', icon: 'building' },
]
