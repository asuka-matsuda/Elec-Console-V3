import type { Site, SiteStatus } from '~/types/admin'
import type { User, UserRole } from '~/types/auth'
import type { SelectOption, TableColumn, TabOption } from '~/types/components'

/**
 * ポータル管理画面 タブ定義
 */
export const ADMIN_TABS: TabOption[] = [
  { value: 'users', label: 'ユーザー管理' },
  { value: 'site', label: '現場管理' },
]

/**
 * ユーザー管理 テーブルカラム定義
 */
export const ADMIN_USER_COLUMNS: TableColumn<User>[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'lastName', label: '名前', sortable: true },
  { key: 'loginId', label: 'ログインID', sortable: true },
  { key: 'role', label: '権限', sortable: true },
  { key: 'lastLoginAt', label: '最終ログイン', sortable: true },
  { key: 'actions', label: '操作' },
]

/**
 * 現場管理 テーブルカラム定義
 */
export const ADMIN_SITE_COLUMNS: TableColumn<Site>[] = [
  { key: 'id', label: '現場ID', sortable: true },
  { key: 'name', label: '現場名', sortable: true },
  { key: 'status', label: 'ステータス', sortable: true },
  { key: 'createdAt', label: '作成日時', sortable: true },
  { key: 'disabledAt', label: '無効化日時', sortable: true },
  { key: 'actions', label: '操作' },
]

/**
 * ユーザー権限（ロール）選択肢
 */
export const USER_ROLE_OPTIONS: SelectOption<UserRole>[] = [
  { value: 'admin', label: '管理者 (admin)' },
  { value: 'worker', label: '作業員 (worker)' },
  { value: 'viewer', label: '閲覧者 (viewer)' },
]

/**
 * ユーザー新規登録 入力フィールド定義
 */
export const USER_CREATE_FORM_FIELDS = [
  { id: 'id', label: '管理ID', placeholder: '例: EMP001' },
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
 * 現場設定モーダル タブ定義
 */
export const SITE_SETTINGS_TABS = [
  { value: 'basic', label: '基本設定', icon: 'info' },
  { value: 'integration', label: '連携設定', icon: 'link' },
  { value: 'rules', label: 'ルール設定', icon: 'filter' },
]
