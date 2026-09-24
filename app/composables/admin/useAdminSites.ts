/**
 * 現場マスター管理 Composable
 *
 * @description 現場一覧の取得・新規作成・更新・削除および選択状態を管理します。
 * @returns {Object} sites 現場一覧Ref, fetchSites 取得関数, createSite 登録関数, updateSite 更新関数, deleteSite 削除関数
 */

import { useState } from '#app'
import { useApi } from '~/composables/useApi'
import { STATE_KEYS } from '~/constants/storageKeys'
import type { Site, SiteSettings } from '~/types/admin'

export const useAdminSites = () => {
  const sites = useState<Site[]>(STATE_KEYS.ADMIN_SITES, () => [])
  const siteSettings = useState<SiteSettings[]>(
    STATE_KEYS.ADMIN_SITE_SETTINGS,
    () => [],
  )
  const isLoaded = useState<boolean>(STATE_KEYS.ADMIN_SITES_LOADED, () => false)
  const isLoading = useState<boolean>('admin-sites-loading', () => false)
  const { $api } = useApi()

  // 初期データの取得（多重リクエスト抑止・ロード済みキャッシュ管理）
  const fetchSites = async (force = false) => {
    if (isLoaded.value && !force) {
      return { sites: sites.value, siteSettings: siteSettings.value }
    }
    if (isLoading.value) {
      return { sites: sites.value, siteSettings: siteSettings.value }
    }

    try {
      isLoading.value = true
      const data = await $api<{ sites: Site[], siteSettings: SiteSettings[] }>(
        '/api/sites',
      )

      sites.value = data.sites || []
      siteSettings.value = data.siteSettings || []
      isLoaded.value = true

      return data
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
      }
      if (res.settings) {
        siteSettings.value = siteSettings.value.map(set =>
          set.siteId === id ? res.settings : set,
        )
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

    const disabledAt = site.disabledAt ? null : new Date().toISOString()

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
