/**
 * 現在選択中の現場情報を取得・解決する Composable
 */
import type { MaybeRefOrGetter } from 'vue'
import { computed, onMounted, toValue } from 'vue'

import { useAdminSites } from '~/composables/admin/useAdminSites'

export function useCurrentSite(siteIdSource: MaybeRefOrGetter<string>) {
  const { sites, fetchSites, isLoaded } = useAdminSites()

  onMounted(() => {
    if (!isLoaded.value) {
      fetchSites()
    }
  })

  const site = computed(() => {
    const id = toValue(siteIdSource)

    if (!id) return undefined

    return sites.value.find(s => s.id === id)
  })

  const siteName = computed(() => site.value?.name || '')

  return {
    site,
    siteName,
  }
}
