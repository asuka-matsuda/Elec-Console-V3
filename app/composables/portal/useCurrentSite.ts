/**
 * 現在選択中の現場情報を取得・解決・操作する現場コンテキスト Composable
 */
import { useLocalStorage } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'
import { computed, getCurrentInstance, onMounted, toValue, watch } from 'vue'

import { useRouter } from '#app'
import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAuth } from '~/composables/useAuth'
import { STORAGE_KEYS } from '~/constants/storageKeys'

export function useCurrentSite(siteIdSource: MaybeRefOrGetter<string>) {
  const router = useRouter()
  const { sites, fetchSites, isLoaded } = useAdminSites()
  const { currentUser } = useAuth()
  const lastSiteId = useLocalStorage(STORAGE_KEYS.LAST_SITE_ID, '')

  if (getCurrentInstance()) {
    onMounted(() => {
      if (!isLoaded.value) {
        fetchSites()
      }
    })
  }
  else if (!isLoaded.value) {
    fetchSites()
  }

  // 現場IDが有効な場合、前回現場IDとしてlocalStorageに同期
  watch(
    () => toValue(siteIdSource),
    (newId) => {
      if (newId) {
        lastSiteId.value = newId
      }
    },
    { immediate: true },
  )

  const site = computed(() => {
    const id = toValue(siteIdSource)

    if (!id) return undefined

    return sites.value.find(s => s.id === id)
  })

  const siteName = computed(() => site.value?.name || '')

  // ユーザーの権限に応じたアサイン現場一覧
  const assignedSites = computed(() => {
    if (currentUser.value?.loginId === 'master') {
      return sites.value
    }

    const ids = currentUser.value?.assignedSiteIds || []

    return sites.value.filter(s => ids.includes(s.id))
  })

  // 現場切り替えセレクトボックス用の選択肢
  const siteOptions = computed(() =>
    assignedSites.value.map(s => ({ value: s.id, label: s.name })),
  )

  // 現場切り替えナビゲーション
  const switchSite = (newSiteId: unknown) => {
    const targetId = String(newSiteId)
    const currentId = toValue(siteIdSource)

    if (!targetId || targetId === currentId) return
    router.push(`/portal/${targetId}`)
  }

  return {
    site,
    siteName,
    sites,
    assignedSites,
    siteOptions,
    switchSite,
    lastSiteId,
  }
}
