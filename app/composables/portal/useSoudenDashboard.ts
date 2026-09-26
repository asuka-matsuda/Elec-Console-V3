/**
 * 送電試験全体ダッシュボード Composable
 *
 * @description 送電試験全体の完了状況、フェーズ1〜3の進捗統計、および現場回路の最新状態をリアルタイムで監視・集計します。
 * @param siteId 対象現場IDのRef
 */

import type { Ref } from 'vue'
import { ref, unref } from 'vue'

import type { SoudenStats } from '#shared/types/circuit'
import { useApi } from '~/composables/useApi'
import { parseToAppException } from '~/utils/errors'

export function useSoudenDashboard(siteIdRef: Ref<string> | string) {
  const { $api } = useApi()
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
      const data = await $api<SoudenStats>(
        `/api/sites/${siteId}/souden/stats`,
      )

      if (data) {
        stats.value = data
      }
    }
    catch (err: unknown) {
      const appErr = parseToAppException(err)

      error.value = appErr.getUserFacingMessage()
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
      const res = await $api<{ success: boolean, count: number }>(
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
      const appErr = parseToAppException(err)

      error.value = appErr.getUserFacingMessage()
      throw appErr
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
