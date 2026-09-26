/**
 * LocalStorage および useState のキー名定義
 * マジックストリングを防止し、キーの重複やタイポを防ぐために一元管理します。
 */

export const STORAGE_KEYS = {
  THEME_MODE: 'elec_theme_mode',
  ANIMATION_ENABLED: 'elec_animation_enabled',
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
  SIDEBAR_OPEN: 'sidebar-open',
  ADMIN_SITES: 'admin-sites',
  ADMIN_SITES_LOADED: 'admin-sites-loaded',
  ADMIN_SITES_LOADING: 'admin-sites-loading',
  ADMIN_SITE_SETTINGS: 'admin-site-settings',
  ADMIN_USERS: 'admin-users',
  ADMIN_USERS_ERROR: 'admin-users-error',
  GLOBAL_MODAL_OPEN: 'global-modal-is-open',
  GLOBAL_MODAL_PENDING: 'global-modal-is-pending',
  GLOBAL_MODAL_OPTIONS: 'global-modal-options',
  SITE_NO_BREAK_WORDS_MAP: 'site_no_break_words_map',
  SITE_NO_BREAK_WORDS_LOADED_MAP: 'site_no_break_words_loaded_map',
  NO_BREAK_WORDS_LOADING: 'no_break_words_loading',
  CALENDAR_EVENTS: (siteId: string) => `calendar-events-${siteId}`,
  CALENDAR_SETTINGS: (siteId: string) => `calendar-settings-${siteId}`,
  OFFLINE_SYNC_QUEUE: (siteId: string) => `offline-sync-queue-${siteId}`,
  OFFLINE_SYNC_SYNCING: (siteId: string) => `offline-sync-syncing-${siteId}`,
} as const
