/**
 * IndexedDB クライアント & リポジトリ
 *
 * Local-First アーキテクチャの中核となるローカルストレージエンジンです。
 * 回路マスター、現場設定、ToDo、未同期キューを高速・堅牢に永続化します。
 */

import { type IDBPDatabase, openDB } from 'idb'

import type { CircuitItem } from '#shared/types/circuit'
import type { Site, SiteSettings } from '#shared/types/site'

import type { AuthCacheRecord, ElecConsoleDB, SyncOutboxRecord, TodoRecord } from './schema'

const DB_NAME = 'elec_console_v3_db'
const DB_VERSION = 2

let dbPromise: Promise<IDBPDatabase<ElecConsoleDB>> | null = null

/**
 * IndexedDB インスタンスの取得 (シングルトン)
 */
async function getLocalDB(): Promise<IDBPDatabase<ElecConsoleDB> | null> {
  if (!import.meta.client || typeof indexedDB === 'undefined') return null

  if (!dbPromise) {
    dbPromise = openDB<ElecConsoleDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 1. 現場マスター
        if (!db.objectStoreNames.contains('sites')) {
          db.createObjectStore('sites', { keyPath: 'id' })
        }

        // 1-2. 現場設定
        if (!db.objectStoreNames.contains('site_settings')) {
          db.createObjectStore('site_settings', { keyPath: 'siteId' })
        }

        // 2. 回路マスター & 試験進捗
        if (!db.objectStoreNames.contains('circuits')) {
          const circuitStore = db.createObjectStore('circuits', { keyPath: 'id' })

          circuitStore.createIndex('by_site', 'siteId')
          circuitStore.createIndex('by_site_keito', ['siteId', 'keiTo'])
          circuitStore.createIndex('by_site_ban', ['siteId', 'banMeisho'])
        }

        // 3. パーソナルToDo (ユーザー分離)
        if (!db.objectStoreNames.contains('todos')) {
          const todoStore = db.createObjectStore('todos', { keyPath: 'id' })

          todoStore.createIndex('by_site_user', ['siteId', 'userId'])
        }

        // 4. 送信キュー (Outbox)
        if (!db.objectStoreNames.contains('sync_outbox')) {
          const outboxStore = db.createObjectStore('sync_outbox', { keyPath: 'id' })

          outboxStore.createIndex('by_site', 'siteId')
          outboxStore.createIndex('by_status', 'status')
          outboxStore.createIndex('by_created', 'createdAt')
        }

        // 5. オフライン認証キャッシュ
        if (!db.objectStoreNames.contains('auth_cache')) {
          db.createObjectStore('auth_cache', { keyPath: 'loginId' })
        }
      },
    }).catch((err) => {
      console.error('[IndexedDB] Failed to open database', err)
      dbPromise = null
      throw err
    })
  }

  return dbPromise
}

/**
 * 現場 (Sites) リポジトリ
 */
export const SitesRepository = {
  async getAll(): Promise<Site[]> {
    const db = await getLocalDB()

    if (!db) return []

    return db.getAll('sites')
  },

  async get(id: string): Promise<Site | undefined> {
    const db = await getLocalDB()

    if (!db) return undefined

    return db.get('sites', id)
  },

  async put(site: Site): Promise<void> {
    const db = await getLocalDB()

    if (!db) return
    await db.put('sites', site)
  },

  async putAll(sites: Site[]): Promise<void> {
    const db = await getLocalDB()

    if (!db || sites.length === 0) return
    const tx = db.transaction('sites', 'readwrite')

    for (const s of sites) {
      tx.store.put(s)
    }
    await tx.done
  },

  async delete(id: string): Promise<void> {
    const db = await getLocalDB()

    if (!db) return
    await db.delete('sites', id)
  },
}

/**
 * 現場設定 (SiteSettings) リポジトリ
 */
export const SiteSettingsRepository = {
  async get(siteId: string): Promise<SiteSettings | undefined> {
    const db = await getLocalDB()

    if (!db) return undefined

    return db.get('site_settings', siteId)
  },

  async getAll(): Promise<SiteSettings[]> {
    const db = await getLocalDB()

    if (!db) return []

    return db.getAll('site_settings')
  },

  async put(settings: SiteSettings): Promise<void> {
    const db = await getLocalDB()

    if (!db) return
    await db.put('site_settings', settings)
  },

  async putAll(settingsList: SiteSettings[]): Promise<void> {
    const db = await getLocalDB()

    if (!db || settingsList.length === 0) return
    const tx = db.transaction('site_settings', 'readwrite')

    for (const s of settingsList) {
      tx.store.put(s)
    }
    await tx.done
  },

  async delete(siteId: string): Promise<void> {
    const db = await getLocalDB()

    if (!db) return
    await db.delete('site_settings', siteId)
  },
}

/**
 * 回路 (Circuits) リポジトリ
 */
export const CircuitsRepository = {
  async getBySite(siteId: string): Promise<CircuitItem[]> {
    const db = await getLocalDB()

    if (!db) return []

    return db.getAllFromIndex('circuits', 'by_site', siteId)
  },

  async getBySiteAndKeiTo(siteId: string, keiTo: string): Promise<CircuitItem[]> {
    const db = await getLocalDB()

    if (!db) return []
    if (!keiTo || keiTo === 'ALL') {
      return db.getAllFromIndex('circuits', 'by_site', siteId)
    }

    return db.getAllFromIndex('circuits', 'by_site_keito', [siteId, keiTo])
  },

  async get(circuitId: string): Promise<CircuitItem | undefined> {
    const db = await getLocalDB()

    if (!db) return undefined

    return db.get('circuits', circuitId)
  },

  async put(circuit: CircuitItem): Promise<void> {
    const db = await getLocalDB()

    if (!db) return
    await db.put('circuits', circuit)
  },

  async putAll(circuits: CircuitItem[]): Promise<void> {
    const db = await getLocalDB()

    if (!db || circuits.length === 0) return
    const tx = db.transaction('circuits', 'readwrite')

    for (const c of circuits) {
      tx.store.put(c)
    }
    await tx.done
  },

  async patch(circuitId: string, patch: Partial<CircuitItem>): Promise<CircuitItem | undefined> {
    const db = await getLocalDB()

    if (!db) return undefined
    const tx = db.transaction('circuits', 'readwrite')
    const current = await tx.store.get(circuitId)

    if (!current) {
      await tx.done

      return undefined
    }
    const updated: CircuitItem = {
      ...current,
      ...patch,
    }

    await tx.store.put(updated)
    await tx.done

    return updated
  },

  async clearSite(siteId: string): Promise<void> {
    const db = await getLocalDB()

    if (!db) return
    const tx = db.transaction('circuits', 'readwrite')
    const index = tx.store.index('by_site')
    let cursor = await index.openCursor(siteId)

    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
    await tx.done
  },
}

/**
 * パーソナル ToDo リポジトリ (ユーザーごとに完全分離)
 */
export const TodosRepository = {
  async getBySiteAndUser(siteId: string, userId: string): Promise<TodoRecord[]> {
    const db = await getLocalDB()

    if (!db) return []
    const items = await db.getAllFromIndex('todos', 'by_site_user', [siteId, userId])

    return items.sort((a, b) => {
      return Number(a.completed) - Number(b.completed) || b.createdAt.localeCompare(a.createdAt)
    })
  },

  async put(todo: TodoRecord): Promise<void> {
    const db = await getLocalDB()

    if (!db) return
    await db.put('todos', todo)
  },

  async delete(id: string): Promise<void> {
    const db = await getLocalDB()

    if (!db) return
    await db.delete('todos', id)
  },
}

/**
 * 送信待ちキュー (Outbox) リポジトリ
 */
export const OutboxRepository = {
  async getBySite(siteId: string): Promise<SyncOutboxRecord[]> {
    const db = await getLocalDB()

    if (!db) return []

    return db.getAllFromIndex('sync_outbox', 'by_site', siteId)
  },

  async getPendingBySite(siteId: string): Promise<SyncOutboxRecord[]> {
    const db = await getLocalDB()

    if (!db) return []
    const all = await db.getAllFromIndex('sync_outbox', 'by_site', siteId)

    return all.filter(item => item.status !== 'conflict')
  },

  async enqueue(item: Omit<SyncOutboxRecord, 'id' | 'createdAt' | 'status'>): Promise<SyncOutboxRecord | undefined> {
    const db = await getLocalDB()

    if (!db) return undefined

    const tx = db.transaction('sync_outbox', 'readwrite')
    const existing = await tx.store.index('by_site').getAll(item.siteId)
    const match = existing.find(
      q => q.circuitId === item.circuitId && q.phase === item.phase && q.status !== 'conflict',
    )

    const record: SyncOutboxRecord = {
      ...item,
      id: match ? match.id : `${item.circuitId}_${item.phase}_${Date.now()}`,
      createdAt: match ? match.createdAt : (item.clientConfirmedAt || new Date().toISOString()),
      status: 'pending',
    }

    await tx.store.put(record)
    await tx.done

    return record
  },

  async remove(id: string): Promise<void> {
    const db = await getLocalDB()

    if (!db) return
    await db.delete('sync_outbox', id)
  },

  async clearSite(siteId: string): Promise<void> {
    const db = await getLocalDB()

    if (!db) return
    const tx = db.transaction('sync_outbox', 'readwrite')
    const index = tx.store.index('by_site')
    let cursor = await index.openCursor(siteId)

    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
    await tx.done
  },

  async updateStatus(
    id: string,
    status: SyncOutboxRecord['status'],
    errorMessage?: string,
    serverCircuitData?: Record<string, unknown>,
  ): Promise<void> {
    const db = await getLocalDB()

    if (!db) return
    const tx = db.transaction('sync_outbox', 'readwrite')
    const item = await tx.store.get(id)

    if (!item) {
      await tx.done

      return
    }
    item.status = status
    if (errorMessage !== undefined) item.errorMessage = errorMessage
    if (serverCircuitData !== undefined) item.serverCircuitData = serverCircuitData
    await tx.store.put(item)
    await tx.done
  },
}

/**
 * 認証キャッシュ リポジトリ
 */
export const AuthCacheRepository = {
  async get(loginId: string): Promise<AuthCacheRecord | undefined> {
    const db = await getLocalDB()

    if (!db) return undefined

    return db.get('auth_cache', loginId)
  },

  async put(record: AuthCacheRecord): Promise<void> {
    const db = await getLocalDB()

    if (!db) return
    await db.put('auth_cache', record)
  },

  async getAll(): Promise<AuthCacheRecord[]> {
    const db = await getLocalDB()

    if (!db) return []

    return db.getAll('auth_cache')
  },

  async delete(loginId: string): Promise<void> {
    const db = await getLocalDB()

    if (!db) return
    await db.delete('auth_cache', loginId)
  },
}
