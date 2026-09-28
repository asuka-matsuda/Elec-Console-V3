/**
 * Cookie および useState のキー名定義
 * LocalStorage は全廃され、永続化には Cookie / IndexedDB / サーバーDB を使用します。
 */

export const STORAGE_KEYS = {
  THEME_MODE: 'elec_theme_mode',
  ANIMATION_ENABLED: 'elec_animation_enabled',
  LAST_SITE_ID: 'last-accessed-site',
  TOOL_HISTORY: (toolId: string) => `elec_calc_${toolId}_hist`,
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
  IS_OFFLINE_SESSION: 'is-offline-session',
  SERVER_TIME_OFFSET: 'server_time_offset',
} as const
