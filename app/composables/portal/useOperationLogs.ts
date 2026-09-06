import type { Ref } from 'vue'
import { ref, unref } from 'vue'

import type { OperationLogItem, OperationLogsResponse } from '~/types/souden'

export function useOperationLogs(siteIdRef: Ref<string> | string) {
  const logs = ref<OperationLogItem[]>([])
  const availableWorkers = ref<string[]>([])
  const availableActions = ref<string[]>([])
  const availableTargetBans = ref<string[]>([])

  const selectedWorker = ref<string>('ALL')
  const selectedAction = ref<string>('ALL')
  const selectedTargetBan = ref<string>('ALL')
  const limit = ref<number>(100)

  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const fetchLogs = async () => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()

      params.append('limit', String(limit.value))

      if (selectedWorker.value && selectedWorker.value !== 'ALL') {
        params.append('worker', selectedWorker.value)
      }

      if (selectedAction.value && selectedAction.value !== 'ALL') {
        params.append('action', selectedAction.value)
      }

      if (selectedTargetBan.value && selectedTargetBan.value !== 'ALL') {
        params.append('targetBan', selectedTargetBan.value)
      }

      const res = await $fetch<OperationLogsResponse>(
        `/api/sites/${siteId}/operation-logs?${params.toString()}`,
      )

      if (res) {
        logs.value = res.logs || []
        availableWorkers.value = res.availableWorkers || []
        availableActions.value = res.availableActions || []
        availableTargetBans.value = res.availableTargetBans || []
      }
    }
    catch (err: unknown) {
      const e = err as Error

      error.value = e.message || 'ログデータの取得に失敗しました'
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    logs,
    availableWorkers,
    availableActions,
    availableTargetBans,
    selectedWorker,
    selectedAction,
    selectedTargetBan,
    limit,
    isLoading,
    error,
    fetchLogs,
  }
}
