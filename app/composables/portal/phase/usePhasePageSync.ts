/**
 * 送電試験ページ共通ルートクエリ・スクロール・オフライン同期 Composable
 *
 * @description phase1.vue, phase2.vue, phase3.vue における
 * ルートクエリ同期（kei_to, ban）、対象回路への自動スクロールハイライト、
 * およびオフライン同期時の自動再取得処理を一元管理します。
 */

import type { ComputedRef, Ref } from 'vue'
import { computed, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'

import type { CircuitItem } from '#shared/types/circuit'
import { useOfflineSync } from '~/composables/portal/useOfflineSync'
import { scrollToTableRow } from '~/utils/table'

interface UsePhasePageSyncOptions {
  siteId: Ref<string> | ComputedRef<string> | string
  selectedKeiTo: Ref<string>
  selectedBanMeisho: Ref<string>
  filteredCircuits: Ref<CircuitItem[]> | ComputedRef<CircuitItem[]>
  fetchCircuits: () => void | Promise<void>
}

export function usePhasePageSync(options: UsePhasePageSyncOptions) {
  const { siteId, selectedKeiTo, selectedBanMeisho, filteredCircuits, fetchCircuits } = options
  const route = useRoute()

  const { lastSyncedAt } = useOfflineSync(siteId)

  watch(lastSyncedAt, (newVal) => {
    if (newVal) {
      fetchCircuits()
    }
  })

  watch(
    () => route.query.kei_to,
    (newKeiTo) => {
      if (newKeiTo && typeof newKeiTo === 'string') {
        selectedKeiTo.value = newKeiTo
        fetchCircuits()
      }
    },
  )

  watch(
    () => route.query.ban,
    (newBan) => {
      if (newBan && typeof newBan === 'string') {
        selectedBanMeisho.value = newBan
      }
      else {
        selectedBanMeisho.value = 'ALL'
      }
    },
    { immediate: true },
  )

  // 遷移時にクエリで指定された回路への自動スクロール＆ハイライト
  const targetCircuitId = computed(() => route.query.targetCircuit as string | undefined)

  watch(
    [() => filteredCircuits.value, targetCircuitId],
    ([newCircuits, targetId]) => {
      if (targetId && newCircuits && newCircuits.some(c => c.id === targetId)) {
        nextTick(() => {
          setTimeout(() => {
            scrollToTableRow(targetId, 2500)
          }, 150)
        })
      }
    },
    { immediate: true },
  )

  const handleSelectCircuit = (circuit: CircuitItem) => {
    scrollToTableRow(circuit.id)
  }

  return {
    handleSelectCircuit,
    targetCircuitId,
  }
}
