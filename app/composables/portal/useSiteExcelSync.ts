/**
 * 現場ポータル Excel 同期 Composable
 *
 * @description 回路リストの Excel 取込・差分反映・ダウンロード処理のフローを管理します。
 */

import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'

import { useNuxtApp } from '#app'
import type { Site } from '#shared/types/site'
import { sanitizeFilename } from '#shared/utils/filename'
import { downloadBlob } from '~/utils/download'
import { getErrorMessage, parseToAppException } from '~/utils/errors'

interface SyncResultInfo {
  type: 'merge' | 'reset'
  title: string
  count: number
  createdCount?: number
  updatedCount?: number
}

interface UseSiteExcelSyncOptions {
  site: Ref<Site | null> | ComputedRef<Site | null>
}

/**
 * 現場ポータルの Excel インポート・直接ダウンロードを管理する Composable
 */
export function useSiteExcelSync(options: UseSiteExcelSyncOptions) {
  const { $api } = useNuxtApp()
  const { site } = options

  const selectedFile = ref<File | null>(null)
  const showSyncMsg = ref(false)
  const syncMsg = ref('')
  const syncMsgType = ref<'success' | 'error' | 'info'>('info')
  const syncAction = ref<'merge' | 'reset' | 'download' | null>(null)
  const isSyncing = computed(() => syncAction.value !== null)

  const syncResultData = ref<SyncResultInfo | null>(null)

  const handleFileSelect = (file: File | null) => {
    selectedFile.value = file
  }

  const resolvePath = (): string => {
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

      const res = await $api<{
        success: boolean
        count: number
        createdCount: number
        updatedCount: number
        filePath?: string
      }>(`/api/sites/${site.value.id}/circuits/import`, {
        method: 'POST',
        body,
      })

      if (res.filePath && site.value) {
        site.value.excelPath = res.filePath
      }

      syncMsg.value = `差分同期完了: ${res.createdCount}件追加、${res.updatedCount}件更新（Web入力値は保護されました）`
      syncMsgType.value = 'success'

      syncResultData.value = {
        type: 'merge',
        title: '差分再同期が完了しました',
        count: res.count,
        createdCount: res.createdCount,
        updatedCount: res.updatedCount,
      }
    }
    catch (err: unknown) {
      const appErr = parseToAppException(err)

      syncMsg.value = appErr.getUserFacingMessage()
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

      const res = await $api<{ success: boolean, count: number, filePath?: string }>(
        `/api/sites/${site.value.id}/circuits/import`,
        {
          method: 'POST',
          body,
        },
      )

      if (res.filePath && site.value) {
        site.value.excelPath = res.filePath
      }

      syncMsg.value = `初期化取り込み完了: 全${res.count}件の回路情報を登録しました`
      syncMsgType.value = 'success'

      syncResultData.value = {
        type: 'reset',
        title: '全件初期化取り込みが完了しました',
        count: res.count,
        createdCount: res.count,
        updatedCount: 0,
      }
    }
    catch (err: unknown) {
      const appErr = parseToAppException(err)

      syncMsg.value = appErr.getUserFacingMessage()
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

  // 3. ブラウザへ直接Excel帳票ダウンロード
  const handleDownloadExcel = async () => {
    if (!site.value?.id) return

    syncAction.value = 'download'
    syncMsg.value = '最新試験結果入りExcel帳票を生成中...'
    syncMsgType.value = 'info'
    showSyncMsg.value = true

    try {
      const response = await $api.raw<Blob>(`/api/sites/${site.value.id}/circuits/export`, {
        method: 'GET',
        responseType: 'blob',
      })

      const blob = response._data

      if (!blob) {
        throw new Error('Excel帳票のダウンロードに失敗しました')
      }

      const safeName = sanitizeFilename(site.value?.name, '現場')

      // Content-Disposition からファイル名（拡張子）を取得
      const disposition = response.headers.get('content-disposition') || ''
      const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)
      let downloadFilename = ''

      if (filenameMatch) {
        downloadFilename = decodeURIComponent(filenameMatch[1] || filenameMatch[2] || '')
      }
      if (!downloadFilename) {
        const originalName = site.value?.excelPath?.split(/[\\/]/).pop()?.trim()
        const isXlsm = site.value?.excelPath?.toLowerCase().endsWith('.xlsm')

        downloadFilename = originalName || `${safeName}.${isXlsm ? 'xlsm' : 'xlsx'}`
      }

      downloadBlob(blob, downloadFilename)

      syncMsg.value = 'Excel帳票のダウンロードが完了しました'
      syncMsgType.value = 'success'
    }
    catch (err: unknown) {
      syncMsg.value = getErrorMessage(err, 'Excel帳票のダウンロードに失敗しました')
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
    handleFileSelect,
    handleMergeSync,
    handleResetImport,
    handleDownloadExcel,
  }
}
