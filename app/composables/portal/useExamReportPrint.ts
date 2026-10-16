/**
 * 送電試験結果 回路データ取得 Composable
 *
 * @description 現場回路データの Local-First 取得（IndexedDB 即座読込・バックグラウンド同期）を提供します。
 */
import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue } from 'vue'

import { useNuxtApp } from '#app'
import type { CircuitItem, CircuitsResponse } from '#shared/types/circuit'
import { CircuitsRepository } from '~/utils/db'

export function useExamReportPrint(
  siteIdSource: MaybeRefOrGetter<string>,
) {
  const { $api } = useNuxtApp()

  const siteId = computed(() => toValue(siteIdSource))
  const circuits = ref<CircuitItem[]>([])

  // 回路データの取得 (Local-First: IndexedDB即座読込 -> バックグラウンド同期)
  const fetchCircuits = async () => {
    if (!siteId.value) return

    // 1. IndexedDB から即座に読み込み
    try {
      const localCircuits = await CircuitsRepository.getBySite(siteId.value)

      if (localCircuits && localCircuits.length > 0) {
        circuits.value = localCircuits
      }
    }
    catch (err) {
      console.warn('[useExamReportPrint] Failed to load circuits from IndexedDB', err)
    }

    // 2. ネットワーク経由で最新データを同期
    try {
      const res = await $api<CircuitsResponse>(`/api/sites/${siteId.value}/circuits`)

      if (res && res.circuits) {
        circuits.value = res.circuits || []
        await CircuitsRepository.putAll(res.circuits)
      }
    }
    catch {
      // オフラインまたは通信エラー時はローカルキャッシュを維持
    }
  }

  return {
    circuits,
    fetchCircuits,
  }
}
