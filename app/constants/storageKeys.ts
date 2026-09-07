/**
 * LocalStorage および useState のキー名定義
 * マジックストリングを防止し、キーの重複やタイポを防ぐために一元管理します。
 */

export const STORAGE_KEYS = {
  THEME_MODE: 'elec_theme_mode',
  LAST_SITE_ID: 'last-accessed-site',
  CACHED_USER: 'elec_cached_user',
  SERVER_TIME_OFFSET: 'elec_server_time_offset',
  OFFLINE_SYNC_QUEUE: (siteId: string) => `elec_offline_sync_queue_${siteId}`,
  TOOL_INPUTS: (toolId: string) => `tool-inputs-${toolId}`,
  TOOL_HISTORY: (toolId: string) => `elec_calc_${toolId}_hist`,
  PORTAL_TODOS: (siteId: string, loginId: string) =>
    `elec-todos-${siteId}-${loginId}`,
} as const

export const STATE_KEYS = {
  CURRENT_USER: 'currentUser',
  ADMIN_SITES: 'admin-sites',
  ADMIN_SITE_SETTINGS: 'admin-site-settings',
  GLOBAL_MODAL_OPEN: 'global-modal-is-open',
  GLOBAL_MODAL_PENDING: 'global-modal-is-pending',
  GLOBAL_MODAL_OPTIONS: 'global-modal-options',
} as const
