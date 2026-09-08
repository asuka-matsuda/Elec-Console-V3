import type { ComputedRef, Ref } from 'vue'
import { computed, ref, watch } from 'vue'

import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import {
  SITE_SETTINGS_TABS,
  SITE_STATUS_OPTIONS,
} from '~/constants/adminConstants'
import type { Site } from '~/types/admin'
import { getAssignedWorkerNames } from '~/utils/portal'

export interface SyncResultInfo {
  type: 'merge' | 'reset' | 'export'
  title: string
  count: number
  createdCount?: number
  updatedCount?: number
  keptCount?: number
  deletedCount?: number
  message: string
}

export interface UseSiteSettingsFormParams {
  site: Ref<Site | null> | ComputedRef<Site | null>
  isOpen: Ref<boolean>
  onSave: (site: Site) => void
}

export const SITE_SETTINGS_STATUS_OPTIONS = SITE_STATUS_OPTIONS
export { SITE_SETTINGS_TABS }

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

  const selectedFile = ref<File | null>(null)

  const handleFileSelect = (file: File | null) => {
    selectedFile.value = file
  }

  const { updateSite } = useAdminSites()

  const showSyncMsg = ref(false)
  const syncMsg = ref('')
  const syncMsgType = ref<'success' | 'error' | 'info'>('info')
  const syncAction = ref<'merge' | 'reset' | 'export' | 'download' | null>(null)
  const isSyncing = computed(() => syncAction.value !== null)

  const syncResultData = ref<SyncResultInfo | null>(null)
  const isResultDialogOpen = ref(false)

  const getCleanPath = () => {
    const rawPath = editData.value.excelPath?.trim()
    const filePath = rawPath ? rawPath.replace(/^["']+|["']+$/g, '').trim() : ''

    editData.value.excelPath = filePath

    return filePath
  }

  const persistSettings = async (filePath: string) => {
    if (!site.value?.id) return
    const parsedCircuits = excludedCircuitsList.value
      .map(c => c.trim())
      .filter(c => c.length > 0)

    // モーダルを閉じずに設定のみをサイレント更新
    await updateSite(site.value.id, {
      ...site.value,
      ...editData.value,
      excelPath: filePath,
      excludedCircuits: parsedCircuits,
    })
  }

  // 1. 差分再同期 (スマートマージ)
  const handleMergeSync = async () => {
    if (!site.value?.id) return

    const filePath = getCleanPath()
    const file = selectedFile.value

    if (!file && !filePath) {
      syncMsg.value = 'Excelファイルを選択するか、絶対パスを入力してください'
      syncMsgType.value = 'error'
      showSyncMsg.value = true

      return
    }

    syncAction.value = 'merge'
    syncMsg.value = 'Excelから差分データを同期中（試験結果を保持）...'
    syncMsgType.value = 'info'
    showSyncMsg.value = true

    try {
      let body: FormData | { filePath: string, mode: string }

      if (file) {
        const fd = new FormData()

        fd.append('file', file)
        fd.append('mode', 'merge')
        body = fd
      }
      else {
        body = { filePath, mode: 'merge' }
      }

      const res = await $fetch<{
        success: boolean
        count: number
        createdCount: number
        updatedCount: number
        keptCount?: number
        deletedCount?: number
      }>(`/api/sites/${site.value.id}/circuits/import`, {
        method: 'POST',
        body,
      })

      syncMsg.value = `差分同期完了: ${res.createdCount}件追加、${res.updatedCount}件更新（Web入力値は保護されました）`
      syncMsgType.value = 'success'

      syncResultData.value = {
        type: 'merge',
        title: '差分再同期が完了しました',
        count: res.count,
        createdCount: res.createdCount,
        updatedCount: res.updatedCount,
        keptCount: res.keptCount,
        deletedCount: res.deletedCount,
        message: `新しく追加された回路: ${res.createdCount}件\n基本情報が更新された回路: ${res.updatedCount}件`,
      }
      isResultDialogOpen.value = true

      if (filePath) {
        await persistSettings(filePath)
      }
    }
    catch (err: unknown) {
      const e = err as { data?: { message?: string }, message?: string }

      syncMsg.value = e.data?.message || e.message || '差分同期に失敗しました'
      syncMsgType.value = 'error'
    }
    finally {
      syncAction.value = null
      setTimeout(() => {
        if (syncMsgType.value === 'success') {
          showSyncMsg.value = false
        }
      }, 7000)
    }
  }

  // 2. 全件初期化取込 (リセット)
  const handleResetImport = async () => {
    if (!site.value?.id) return

    const filePath = getCleanPath()
    const file = selectedFile.value

    if (!file && !filePath) {
      syncMsg.value = 'Excelファイルを選択するか、絶対パスを入力してください'
      syncMsgType.value = 'error'
      showSyncMsg.value = true

      return
    }

    syncAction.value = 'reset'
    syncMsg.value = 'Excelから全件初期化取り込み中...'
    syncMsgType.value = 'info'
    showSyncMsg.value = true

    try {
      let body: FormData | { filePath: string, mode: string }

      if (file) {
        const fd = new FormData()

        fd.append('file', file)
        fd.append('mode', 'reset')
        body = fd
      }
      else {
        body = { filePath, mode: 'reset' }
      }

      const res = await $fetch<{ success: boolean, count: number }>(
        `/api/sites/${site.value.id}/circuits/import`,
        {
          method: 'POST',
          body,
        },
      )

      syncMsg.value = `初期化取込完了: 全${res.count}件の回路情報を登録しました`
      syncMsgType.value = 'success'

      syncResultData.value = {
        type: 'reset',
        title: '全件初期化取込が完了しました',
        count: res.count,
        createdCount: res.count,
        updatedCount: 0,
        message: `全 ${res.count} 件の回路情報を取り込みました。`,
      }
      isResultDialogOpen.value = true

      if (filePath) {
        await persistSettings(filePath)
      }
    }
    catch (err: unknown) {
      const e = err as { data?: { message?: string }, message?: string }

      syncMsg.value = e.data?.message || e.message || '初期化取り込みに失敗しました'
      syncMsgType.value = 'error'
    }
    finally {
      syncAction.value = null
      setTimeout(() => {
        if (syncMsgType.value === 'success') {
          showSyncMsg.value = false
        }
      }, 7000)
    }
  }

  // 3. Excelへ書戻し (実エクスポート)
  const handleExport = async () => {
    if (!site.value?.id) return

    const filePath = getCleanPath()

    if (!filePath) {
      syncMsg.value = 'Excel連携ファイルの絶対パスを入力してください'
      syncMsgType.value = 'error'
      showSyncMsg.value = true

      return
    }

    syncAction.value = 'export'
    syncMsg.value = 'Web上の試験結果をExcelへ書戻し中...'
    syncMsgType.value = 'info'
    showSyncMsg.value = true

    try {
      const res = await $fetch<{ success: boolean, count: number }>(
        `/api/sites/${site.value.id}/circuits/export`,
        {
          method: 'POST',
          body: { filePath },
        },
      )

      syncMsg.value = `Excelへ${res.count}件の最新試験結果を書き戻しました`
      syncMsgType.value = 'success'

      syncResultData.value = {
        type: 'export',
        title: 'Excel書戻しが完了しました',
        count: res.count,
        message: `Web上の最新試験結果（Phase 1〜3）${res.count}件をExcelファイルに書き戻しました。`,
      }
      isResultDialogOpen.value = true

      await persistSettings(filePath)
    }
    catch (err: unknown) {
      const e = err as { data?: { message?: string }, message?: string }

      syncMsg.value = e.data?.message || e.message || 'Excelへの書戻しに失敗しました'
      syncMsgType.value = 'error'
    }
    finally {
      syncAction.value = null
      setTimeout(() => {
        if (syncMsgType.value === 'success') {
          showSyncMsg.value = false
        }
      }, 7000)
    }
  }

  // 4. ブラウザへ直接Excel帳票ダウンロード
  const handleDownloadExcel = async () => {
    if (!site.value?.id) return

    syncAction.value = 'download'
    syncMsg.value = '最新試験結果入りExcel帳票を生成中...'
    syncMsgType.value = 'info'
    showSyncMsg.value = true

    try {
      const response = await fetch(`/api/sites/${site.value.id}/circuits/export`, {
        method: 'GET',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)

        throw new Error(errorData?.message || 'Excel帳票のダウンロードに失敗しました')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const safeName = (site.value.name || '現場').replace(/[\\/:*?"<>|]/g, '_')

      a.href = url
      a.download = `${safeName}_回路試験結果.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      syncMsg.value = 'Excel帳票のダウンロードが完了しました'
      syncMsgType.value = 'success'
    }
    catch (err: unknown) {
      const e = err as Error

      syncMsg.value = e.message || 'Excel帳票のダウンロードに失敗しました'
      syncMsgType.value = 'error'
    }
    finally {
      syncAction.value = null
      setTimeout(() => {
        if (syncMsgType.value === 'success') {
          showSyncMsg.value = false
        }
      }, 5000)
    }
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
    selectedFile,
    handleFileSelect,
    showSyncMsg,
    syncMsg,
    syncMsgType,
    syncAction,
    isSyncing,
    syncResultData,
    isResultDialogOpen,
    handleMergeSync,
    handleResetImport,
    handleExport,
    handleDownloadExcel,
  }
}
