import type { ComputedRef, Ref } from 'vue'
import { computed, ref, watch } from 'vue'

import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import { type SyncResultInfo, useSiteExcelSync } from '~/composables/portal/useSiteExcelSync'
import {
  SITE_SETTINGS_TABS,
  SITE_STATUS_OPTIONS,
} from '~/constants/adminConstants'
import type { Site } from '~/types/admin'
import { getAssignedWorkerNames } from '~/utils/portal'

export type { SyncResultInfo }

export interface UseSiteSettingsFormParams {
  site: Ref<Site | null> | ComputedRef<Site | null>
  isOpen: Ref<boolean>
  onSave: (site: Site) => void
}

export const SITE_SETTINGS_STATUS_OPTIONS = SITE_STATUS_OPTIONS
export { SITE_SETTINGS_TABS }

/**
 * 現場基本情報・除外回路設定フォームの入力状態管理 Composable
 */
export function useSiteSettingsForm(params: UseSiteSettingsFormParams) {
  const { site, isOpen, onSave } = params
  const { users, fetchUsers } = useAdminUsers()
  const { updateSite } = useAdminSites()

  const editData = ref<Partial<Site>>({})
  const excludedCircuitsList = ref<string[]>([])
  const activeTab = ref('basic')

  const addCircuit = () => {
    excludedCircuitsList.value.push('')
  }

  const removeCircuit = (idx: number) => {
    excludedCircuitsList.value.splice(idx, 1)
  }

  watch(
    site,
    (newSite) => {
      if (newSite) {
        editData.value = { ...newSite }
        excludedCircuitsList.value = [...(newSite.excludedCircuits || [])]
      }
      else {
        editData.value = {}
        excludedCircuitsList.value = []
      }
    },
    { immediate: true },
  )

  watch(isOpen, async (val) => {
    if (val && users.value.length === 0) {
      await fetchUsers()
    }
  })

  const editStatus = computed({
    get: () => (editData.value.status || '') as string,
    set: (val: string) =>
      (editData.value.status = val as typeof editData.value.status),
  })

  const editId = computed({
    get: () => (editData.value.id || '') as string,
    set: (val: string) => (editData.value.id = val),
  })

  // ワーカー名解決
  const workerNames = computed(() =>
    getAssignedWorkerNames(site.value?.id, users.value),
  )

  // 自動クォート除去（Windowsのエクスプローラー「パスのコピー」対策）
  watch(
    () => editData.value.excelPath,
    (val) => {
      if (typeof val === 'string' && (/^["']/.test(val) || /["']$/.test(val))) {
        editData.value.excelPath = val.replace(/^["']+|["']+$/g, '').trim()
      }
    },
  )
  watch(
    () => editData.value.reportTemplatePath,
    (val) => {
      if (typeof val === 'string' && (/^["']/.test(val) || /["']$/.test(val))) {
        editData.value.reportTemplatePath = val.replace(/^["']+|["']+$/g, '').trim()
      }
    },
  )

  const handleSave = () => {
    if (!site.value) return

    if (editData.value.excelPath) {
      editData.value.excelPath = editData.value.excelPath.trim().replace(/^["']+|["']+$/g, '').trim()
    }
    if (editData.value.reportTemplatePath) {
      editData.value.reportTemplatePath = editData.value.reportTemplatePath.trim().replace(/^["']+|["']+$/g, '').trim()
    }

    const parsedCircuits = excludedCircuitsList.value
      .map(c => c.trim())
      .filter(c => c.length > 0)

    const payload: Site = {
      ...site.value,
      ...editData.value,
      excludedCircuits: parsedCircuits,
    }

    onSave(payload)
    isOpen.value = false
  }

  // Excel同期処理は useSiteExcelSync に委譲（関心事の分離）
  const excelSync = useSiteExcelSync({
    site,
    getFilePath: () => {
      const rawPath = editData.value.excelPath?.trim()
      const filePath = rawPath ? rawPath.replace(/^["']+|["']+$/g, '').trim() : ''

      editData.value.excelPath = filePath

      return filePath
    },
    onPersistPath: async (filePath: string) => {
      if (!site.value?.id) return
      const parsedCircuits = excludedCircuitsList.value
        .map(c => c.trim())
        .filter(c => c.length > 0)

      await updateSite(site.value.id, {
        ...site.value,
        ...editData.value,
        excelPath: filePath,
        excludedCircuits: parsedCircuits,
      })
    },
  })

  return {
    editData,
    editStatus,
    editId,
    excludedCircuitsList,
    addCircuit,
    removeCircuit,
    activeTab,
    tabs: SITE_SETTINGS_TABS,
    statusOptions: SITE_SETTINGS_STATUS_OPTIONS,
    workerNames,
    handleSave,
    ...excelSync,
  }
}
