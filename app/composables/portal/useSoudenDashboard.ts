/**
 * 送電試験全体ダッシュボード Composable
 *
 * @description 送電試験全体の完了状況、フェーズ1〜3の進捗統計、および現場回路の最新状態をリアルタイムで監視・集計します。
 * @param siteId 対象現場IDのRef
 */

import type { Ref } from 'vue'
import { computed, ref, unref, watch } from 'vue'

import { useNuxtApp } from '#app'
import type { CircuitItem, CircuitsResponse, SoudenStats } from '#shared/types/circuit'
import { calculateSoudenStats } from '#shared/utils/soudenExam'
import type { SelectOption } from '~/types/components'
import { CircuitsRepository } from '~/utils/db'
import { parseToAppException } from '~/utils/errors'

export function useSoudenDashboard(siteIdRef: Ref<string> | string) {
  const { $api } = useNuxtApp()
  const allCircuits = ref<CircuitItem[]>([])
  const selectedFloor = ref<string>('ALL')
  const isLoading = ref(true)
  const isImporting = ref(false)
  const error = ref<string | null>(null)

  // フロア選択肢（一意なフロア一覧を自然順ソート）
  const floorOptions = computed<SelectOption[]>(() => {
    const set = new Set<string>()
    let hasUnset = false

    for (const c of allCircuits.value) {
      const f = (c.floor || '').trim()

      if (f) {
        set.add(f)
      }
      else {
        hasUnset = true
      }
    }

    const sortedFloors = Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    )

    const options: SelectOption[] = [
      { label: 'すべてのフロア', value: 'ALL' },
    ]

    for (const f of sortedFloors) {
      options.push({ label: f, value: f })
    }

    if (hasUnset && set.size > 0) {
      options.push({ label: 'フロア未設定', value: '__UNSET__' })
    }

    return options
  })

  // 選択中フロアの整合性担保（存在しないフロアが指定された場合はALLにリセット）
  watch(floorOptions, (opts) => {
    if (selectedFloor.value !== 'ALL' && !opts.some(o => o.value === selectedFloor.value)) {
      selectedFloor.value = 'ALL'
    }
  })

  // フロア絞り込み後の回路一覧
  const filteredCircuits = computed<CircuitItem[]>(() => {
    if (selectedFloor.value === 'ALL') {
      return allCircuits.value
    }
    if (selectedFloor.value === '__UNSET__') {
      return allCircuits.value.filter(c => !(c.floor || '').trim())
    }

    return allCircuits.value.filter(c => (c.floor || '').trim() === selectedFloor.value)
  })

  // 絞り込み後の送電試験進捗統計
  const stats = computed<SoudenStats | null>(() => {
    if (allCircuits.value.length === 0) return null

    return calculateSoudenStats(filteredCircuits.value)
  })

  const fetchStats = async () => {
    const siteId = unref(siteIdRef)

    if (!siteId) {
      isLoading.value = false

      return
    }

    error.value = null

    // 1. 【Local-First】 IndexedDB のローカル回路から即座に集計 (0ms / オフライン完全保証)
    try {
      const localCircuits = await CircuitsRepository.getBySite(siteId)

      if (localCircuits && localCircuits.length > 0) {
        allCircuits.value = localCircuits
        isLoading.value = false
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
        allCircuits.value = res.circuits
      }
    }
    catch (err: unknown) {
      // オフライン時、ローカルにデータがあればエラーにしない
      if (allCircuits.value.length === 0) {
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
    allCircuits,
    filteredCircuits,
    selectedFloor,
    floorOptions,
    stats,
    isLoading,
    isImporting,
    error,
    fetchStats,
    importExcel,
  }
}
