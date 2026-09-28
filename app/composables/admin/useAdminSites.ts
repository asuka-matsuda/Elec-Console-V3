/**
 * 現場マスター管理 Composable (Local-First Architecture)
 *
 * @description 現場一覧の取得・新規作成・更新・削除および IndexedDB 永続化を管理します。
 * オフライン環境でも現場一覧や現場設定が瞬時に復元されます。
 */

import { useNuxtApp, useState } from '#app'
import type { Site, SiteSettings } from '#shared/types/site'
import { useAuth } from '~/composables/useAuth'
import { STATE_KEYS } from '~/constants/storageKeys'
import { SiteSettingsRepository, SitesRepository } from '~/utils/db'

export function useAdminSites() {
  const sites = useState<Site[]>(STATE_KEYS.ADMIN_SITES, () => [])
  const siteSettings = useState<SiteSettings[]>(
    STATE_KEYS.ADMIN_SITE_SETTINGS,
    () => [],
  )
  const isLoaded = useState<boolean>(STATE_KEYS.ADMIN_SITES_LOADED, () => false)
  const isLoading = useState<boolean>(
    STATE_KEYS.ADMIN_SITES_LOADING,
    () => false,
  )
  const { $api } = useNuxtApp()
  const { getAccurateNowIso } = useAuth()

  // 初期データの取得 (Local-First: IndexedDB即座読込 -> バックグラウンド同期)
  const fetchSites = async (force = false) => {
    if (isLoaded.value && !force) {
      return { sites: sites.value, siteSettings: siteSettings.value }
    }
    if (isLoading.value) {
      return { sites: sites.value, siteSettings: siteSettings.value }
    }

    isLoading.value = true

    // 1. IndexedDB から即座に読み込み
    try {
      const [localSites, localSettings] = await Promise.all([
        SitesRepository.getAll(),
        SiteSettingsRepository.getAll(),
      ])

      if (localSites && localSites.length > 0) {
        sites.value = localSites
        siteSettings.value = localSettings || []
        isLoaded.value = true
      }
    }
    catch (err) {
      console.warn('[useAdminSites] Failed to load sites from IndexedDB', err)
    }

    // 2. ネットワーク経由で最新データを同期
    try {
      const data = await $api<{ sites: Site[], siteSettings: SiteSettings[] }>(
        '/api/sites',
      )

      if (data) {
        sites.value = data.sites || []
        siteSettings.value = data.siteSettings || []
        isLoaded.value = true

        // IndexedDB に保存
        if (data.sites) {
          await SitesRepository.putAll(data.sites)
        }
        if (data.siteSettings) {
          await SiteSettingsRepository.putAll(data.siteSettings)
        }
      }

      return data
    }
    catch (err: unknown) {
      // オフライン時はローカルデータがあれば正常扱い
      if (sites.value.length > 0) {
        return { sites: sites.value, siteSettings: siteSettings.value }
      }
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  const createSite = async (site: Omit<Site, 'createdAt' | 'disabledAt'>) => {
    try {
      const res = await $api<{ site: Site, settings: SiteSettings }>(
        '/api/sites',
        {
          method: 'POST',
          body: site,
        },
      )

      sites.value.push(res.site)
      siteSettings.value.push(res.settings)
      await Promise.all([
        SitesRepository.put(res.site),
        SiteSettingsRepository.put(res.settings),
      ])
    }
    catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string, statusMessage?: string }, message?: string }
      const errMsg = fetchErr.data?.message || fetchErr.data?.statusMessage || fetchErr.message

      if (errMsg) {
        throw new Error(errMsg, { cause: err })
      }
      throw err
    }
  }

  const updateSite = async (
    id: string,
    updates: Partial<Omit<Site, 'createdAt'>>,
  ) => {
    try {
      const res = await $api<{ site: Site, settings: SiteSettings }>(
        `/api/sites/${id}`,
        {
          method: 'PUT',
          body: { site: updates },
        },
      )

      if (res.site) {
        sites.value = sites.value.map(s => (s.id === id ? res.site : s))
        await SitesRepository.put(res.site)
      }
      if (res.settings) {
        siteSettings.value = siteSettings.value.map(set =>
          set.siteId === id ? res.settings : set,
        )
        await SiteSettingsRepository.put(res.settings)
      }

      return res
    }
    catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string, statusMessage?: string }, message?: string }
      const errMsg = fetchErr.data?.message || fetchErr.data?.statusMessage || fetchErr.message

      if (errMsg) {
        throw new Error(errMsg, { cause: err })
      }
      throw err
    }
  }

  const deleteSite = async (id: string) => {
    try {
      await $api(`/api/sites/${id}`, { method: 'DELETE' })
      sites.value = sites.value.filter(s => s.id !== id)
      siteSettings.value = siteSettings.value.filter(s => s.siteId !== id)
      await Promise.all([
        SitesRepository.delete(id),
        SiteSettingsRepository.delete(id),
      ])
    }
    catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string, statusMessage?: string }, message?: string }
      const errMsg = fetchErr.data?.message || fetchErr.data?.statusMessage || fetchErr.message

      if (errMsg) {
        throw new Error(errMsg, { cause: err })
      }
      throw err
    }
  }

  const toggleDisableSite = async (id: string) => {
    const site = sites.value.find(s => s.id === id)

    if (!site) return

    const disabledAt = site.disabledAt ? null : getAccurateNowIso()

    await updateSite(id, { disabledAt })
  }

  const updateSettings = async (
    siteId: string,
    updates: Partial<Omit<SiteSettings, 'siteId'>>,
  ) => {
    const res = await $api<{ site: Site, settings: SiteSettings }>(
      `/api/sites/${siteId}`,
      {
        method: 'PUT',
        body: { settings: updates },
      },
    )

    if (res.settings) {
      siteSettings.value = siteSettings.value.map(set =>
        set.siteId === siteId ? res.settings : set,
      )
      await SiteSettingsRepository.put(res.settings)
    }
  }

  const getSettings = (siteId: string) => {
    return siteSettings.value.find(s => s.siteId === siteId) || null
  }

  return {
    sites,
    siteSettings,
    isLoaded,
    fetchSites,
    createSite,
    updateSite,
    deleteSite,
    toggleDisableSite,
    updateSettings,
    getSettings,
  }
}
