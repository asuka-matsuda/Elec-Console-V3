import type { Ref } from 'vue'
import { ref, unref } from 'vue'

import type { SoudenStats } from '~/types/portal'

export function useSoudenDashboard(siteIdRef: Ref<string> | string) {
  const stats = ref<SoudenStats | null>(null)
  const isLoading = ref(false)
  const isImporting = ref(false)
  const error = ref<string | null>(null)

  const fetchStats = async () => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    isLoading.value = true
    error.value = null

    try {
      const data = await $fetch<SoudenStats>(
        `/api/sites/${siteId}/souden/stats`,
      )

      if (data) {
        stats.value = data
      }
    }
    catch (err: unknown) {
      const e = err as Error

      error.value = e.message || '進捗データの取得中にエラーが発生しました'
    }
    finally {
      isLoading.value = false
    }
  }

  const importExcel = async (filePath?: string) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    isImporting.value = true
    error.value = null

    try {
      const res = await $fetch<{ success: boolean, count: number }>(
        `/api/sites/${siteId}/circuits/import`,
        {
          method: 'POST',
          body: { filePath },
        },
      )

      await fetchStats()

      return res
    }
    catch (err: unknown) {
      const e = err as { data?: { message?: string }, message?: string }

      error.value = e.data?.message || e.message || 'Excelの取り込み中にエラーが発生しました'
      throw err
    }
    finally {
      isImporting.value = false
    }
  }

  return {
    stats,
    isLoading,
    isImporting,
    error,
    fetchStats,
    importExcel,
  }
}
