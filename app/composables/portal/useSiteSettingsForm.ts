import type { ComputedRef, Ref } from 'vue'
import { computed, ref, watch } from 'vue'

import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import type { Site } from '~/types/admin'
import { getAssignedWorkerNames } from '~/utils/portal'

export interface UseSiteSettingsFormParams {
  site: Ref<Site | null> | ComputedRef<Site | null>
  isOpen: Ref<boolean>
  onSave: (site: Site) => void
}

export const SITE_SETTINGS_STATUS_OPTIONS = [
  { label: '計画中', value: 'planning' },
  { label: '進行中', value: 'in_progress' },
  { label: '完了', value: 'completed' },
  { label: '保留', value: 'on_hold' },
]

export const SITE_SETTINGS_TABS = [
  { value: 'basic', label: '基本設定', icon: 'info' },
  { value: 'integration', label: '連携設定', icon: 'link' },
  { value: 'rules', label: 'ルール設定', icon: 'filter' },
]

export function useSiteSettingsForm(params: UseSiteSettingsFormParams) {
  const { site, isOpen, onSave } = params
  const { users, fetchUsers } = useAdminUsers()

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

  const handleSave = () => {
    if (!site.value) return
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

  const showSyncMsg = ref(false)
  const syncMsg = ref('')

  const handleImport = () => {
    syncMsg.value = 'Excelからデータの取込が完了しました（ダミー）'
    showSyncMsg.value = true
    setTimeout(() => (showSyncMsg.value = false), 3000)
  }

  const handleExport = () => {
    syncMsg.value = 'Excelへデータを書戻しました（ダミー）'
    showSyncMsg.value = true
    setTimeout(() => (showSyncMsg.value = false), 3000)
  }

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
    showSyncMsg,
    syncMsg,
    handleImport,
    handleExport,
  }
}
