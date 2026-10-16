/**
 * アプリケーション全体状態（useState）型マッピング定義
 *
 * STATE_KEYS と各ステート値の厳密な型バインディングを提供し、
 * useAppState における型引数指定の省略と完全推論を実現します。
 */

import type { User } from '#shared/types/auth'
import type { Site } from '#shared/types/site'
import type { STATE_KEYS } from '~/constants/storageKeys'
import type { ToastItem } from '~/types/components'

export interface AppStateMap {
  [STATE_KEYS.CURRENT_USER]: User | null
  [STATE_KEYS.SIDEBAR_OPEN]: boolean
  [STATE_KEYS.ADMIN_SITES]: Site[]
  [STATE_KEYS.ADMIN_SITES_LOADED]: boolean
  [STATE_KEYS.ADMIN_SITES_LOADING]: boolean
  [STATE_KEYS.ADMIN_USERS]: User[]
  [STATE_KEYS.IS_OFFLINE_SESSION]: boolean
  [STATE_KEYS.SERVER_TIME_OFFSET]: number
  [STATE_KEYS.TOAST_LIST]: ToastItem[]
}
