/**
 * 送電試験全体ダッシュボード Composable
 *
 * @description 送電試験全体の完了状況、フェーズ1〜3の進捗統計、および現場回路の最新状態をリアルタイムで監視・集計します。
 * @param siteId 対象現場IDのRef
 */

import type { Ref } from 'vue'
import { ref, unref } from 'vue'

import { useNuxtApp } from '#app'
import type { CircuitsResponse, SoudenStats } from '#shared/types/circuit'
import { calculateSoudenStats } from '#shared/utils/soudenExam'
import { CircuitsRepository } from '~/utils/db'
import { parseToAppException } from '~/utils/errors'

export function useSoudenDashboard(siteIdRef: Ref<string> | string) {
  const { $api } = useNuxtApp()
  const stats = ref<SoudenStats | null>(null)
  const isLoading = ref(false)
  const isImporting = ref(false)
  const error = ref<string | null>(null)

  const fetchStats = async () => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    error.value = null

    // 1. 【Local-First】 IndexedDB のローカル回路から即座に集計 (0ms / オフライン完全保証)
    try {
      const localCircuits = await CircuitsRepository.getBySite(siteId)

      if (localCircuits && localCircuits.length > 0) {
        stats.value = calculateSoudenStats(localCircuits)
      }
      else {
        isLoading.value = true
      }
    }
    catch (dbErr) {
      console.warn('[useSoudenDashboard] Failed to read from IndexedDB', dbErr)
      isLoading.value = true
    }

    // 2. ネットワーク接続があれば、全回路を取得して IndexedDB を自動最新化
    try {
      const res = await $api<CircuitsResponse>(`/api/sites/${siteId}/circuits`)

      if (res && res.circuits) {
        await CircuitsRepository.putAll(res.circuits)
        stats.value = calculateSoudenStats(res.circuits)
      }
    }
    catch (err: unknown) {
      // オフライン時、ローカルにデータがあればエラーにしない
      if (!stats.value) {
        const appErr = parseToAppException(err)

        error.value = appErr.getUserFacingMessage()
      }
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
