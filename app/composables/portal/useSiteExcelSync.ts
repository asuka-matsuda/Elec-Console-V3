import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'

import type { Site } from '~/types/admin'

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

export interface UseSiteExcelSyncOptions {
  site: Ref<Site | null> | ComputedRef<Site | null>
  getFilePath?: () => string
  onPersistPath?: (filePath: string) => Promise<void>
}

/**
 * 現場ポータルの Excel インポート・エクスポート・直接ダウンロードを管理する Composable
 */
export function useSiteExcelSync(options: UseSiteExcelSyncOptions) {
  const { site, getFilePath, onPersistPath } = options

  const selectedFile = ref<File | null>(null)
  const showSyncMsg = ref(false)
  const syncMsg = ref('')
  const syncMsgType = ref<'success' | 'error' | 'info'>('info')
  const syncAction = ref<'merge' | 'reset' | 'export' | 'download' | null>(null)
  const isSyncing = computed(() => syncAction.value !== null)

  const syncResultData = ref<SyncResultInfo | null>(null)
  const isResultDialogOpen = ref(false)

  const handleFileSelect = (file: File | null) => {
    selectedFile.value = file
  }

  const resolvePath = (): string => {
    if (getFilePath) {
      return getFilePath()
    }
    const raw = site.value?.excelPath?.trim() || ''

    return raw.replace(/^["']+|["']+$/g, '').trim()
  }

  // 1. 差分再同期 (スマートマージ)
  const handleMergeSync = async () => {
    if (!site.value?.id) return

    const filePath = resolvePath()
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

      if (filePath && onPersistPath) {
        await onPersistPath(filePath)
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

    const filePath = resolvePath()
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

      syncMsg.value = `初期化取り込み完了: 全${res.count}件の回路情報を登録しました`
      syncMsgType.value = 'success'

      syncResultData.value = {
        type: 'reset',
        title: '全件初期化取り込みが完了しました',
        count: res.count,
        createdCount: res.count,
        updatedCount: 0,
        message: `全 ${res.count} 件の回路情報を取り込みました。`,
      }
      isResultDialogOpen.value = true

      if (filePath && onPersistPath) {
        await onPersistPath(filePath)
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

    const filePath = resolvePath()

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

      if (onPersistPath) {
        await onPersistPath(filePath)
      }
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
    selectedFile,
    showSyncMsg,
    syncMsg,
    syncMsgType,
    syncAction,
    isSyncing,
    syncResultData,
    isResultDialogOpen,
    handleFileSelect,
    handleMergeSync,
    handleResetImport,
    handleExport,
    handleDownloadExcel,
  }
}
