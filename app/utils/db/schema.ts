/**
 * IndexedDB スキーマおよびエンティティ型定義
 * Local-First アーキテクチャの永続化ストレージ基盤定義です。
 */

import type { DBSchema } from 'idb'

import type { User } from '#shared/types/auth'
import type { CircuitItem } from '#shared/types/circuit'
import type { Site, SiteSettings } from '#shared/types/site'

/**
 * 現場パーソナル ToDo レコード
 */
export interface TodoRecord {
  id: string
  siteId: string
  userId: string
  text: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 送信待ちキュー (Outbox) レコード
 */
export interface SyncOutboxRecord {
  id: string
  siteId: string
  circuitId: string
  banMeisho: string
  kairoBangou: string
  kairoMeisho: string
  phase: 1 | 2 | 3
  actionType: 'confirm' | 'clear'
  payload: Record<string, unknown>
  clientConfirmedAt: string
  expectedUpdatedAt?: string
  expectedVersion?: number
  workerName?: string
  createdAt: string
  status: 'pending' | 'syncing' | 'conflict' | 'error'
  errorMessage?: string
  serverCircuitData?: Record<string, unknown>
}

/**
 * オフライン認証キャッシュレコード
 */
export interface AuthCacheRecord {
  loginId: string
  user: User
  passwordSalt: string
  passwordHash: string
  cachedAt: string
  expiresAt: string
  serverTimeOffset?: number
}

/**
 * Elec-Console ローカル IndexedDB 型スキーマ
 */
export interface ElecConsoleDB extends DBSchema {
  sites: {
    key: string
    value: Site
  }
  site_settings: {
    key: string
    value: SiteSettings
  }
  circuits: {
    key: string
    value: CircuitItem
    indexes: {
      by_site: string
      by_site_keito: [string, string]
      by_site_ban: [string, string]
    }
  }
  todos: {
    key: string
    value: TodoRecord
    indexes: {
      by_site_user: [string, string]
    }
  }
  sync_outbox: {
    key: string
    value: SyncOutboxRecord
    indexes: {
      by_site: string
      by_status: string
      by_created: string
    }
  }
  auth_cache: {
    key: string
    value: AuthCacheRecord
  }
}
