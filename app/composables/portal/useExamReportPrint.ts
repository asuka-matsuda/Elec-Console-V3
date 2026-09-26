/**
 * 送電試験結果 Excel 帳票出力 Composable
 *
 * @description 現場回路データの取得、盤ごとの集計、およびテンプレート反映・帳票（Excel / ZIP）生成とダウンロードを提供します。
 */
import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue } from 'vue'

import type { CircuitItem } from '#shared/types/circuit'
import { useApi } from '~/composables/useApi'
import {
  generateExamReportExcel,
  generateExamReportsZip,
  type SelectedDevicesMap,
} from '~/utils/examReportExcel'

interface UseExamReportPrintOptions {
  siteName?: MaybeRefOrGetter<string>
  hasSiteSettingExcel?: MaybeRefOrGetter<boolean>
}

export function useExamReportPrint(
  siteIdSource: MaybeRefOrGetter<string>,
  options: UseExamReportPrintOptions = {},
) {
  const { $api } = useApi()

  const siteId = computed(() => toValue(siteIdSource))
  const siteName = computed(() => toValue(options.siteName) || '現場')
  const hasSiteSettingExcel = computed(() => Boolean(toValue(options.hasSiteSettingExcel)))

  const circuits = ref<CircuitItem[]>([])
  const isLoadingCircuits = ref(false)
  const circuitsError = ref<string | null>(null)

  const selectedBan = ref<string>('ALL')
  const isGenerating = ref(false)
  const message = ref<{ type: 'success' | 'error', text: string } | null>(null)

  // 盤名称の一覧
  const banList = computed(() => {
    const banSet = new Set<string>()

    for (const c of circuits.value) {
      if (c.banMeisho?.trim()) {
        banSet.add(c.banMeisho.trim())
      }
    }

    return Array.from(banSet).sort()
  })

  // 各盤の回路数マップ
  const banCircuitCountMap = computed(() => {
    const map = new Map<string, number>()

    for (const c of circuits.value) {
      const ban = c.banMeisho?.trim()

      if (ban) {
        map.set(ban, (map.get(ban) || 0) + 1)
      }
    }

    return map
  })

  // 出力対象の選択肢（Selectコンポーネント用）
  const banOptions = computed(() => [
    {
      value: 'ALL',
      label: `全盤一括出力 (${banList.value.length}盤 / ${circuits.value.length}回路)`,
    },
    ...banList.value.map(ban => ({
      value: ban,
      label: `${ban} (${banCircuitCountMap.value.get(ban) || 0}回路)`,
    })),
  ])

  // 回路データの取得
  const fetchCircuits = async () => {
    if (!siteId.value) return
    isLoadingCircuits.value = true
    circuitsError.value = null

    try {
      const res = await $api<{ circuits: CircuitItem[] }>(`/api/sites/${siteId.value}/circuits`)

      circuits.value = res.circuits || []
      selectedBan.value = 'ALL'
    }
    catch (err: unknown) {
      const errorObj = err as Error

      circuitsError.value = errorObj.message || '回路データの取得に失敗しました'
    }
    finally {
      isLoadingCircuits.value = false
    }
  }

  // ブラウザでのBlobダウンロードヘルパー
  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 帳票出力実行（単一盤Excelまたは全盤ZIP）
  const generateReport = async (selectedDevices: SelectedDevicesMap) => {
    if (!selectedBan.value) {
      message.value = { type: 'error', text: '出力対象の盤を選択してください' }

      return
    }

    if (!hasSiteSettingExcel.value) {
      message.value = { type: 'error', text: '現場設定にExcelファイルパスが登録されていません' }

      return
    }

    isGenerating.value = true
    message.value = null

    try {
      const res = await fetch(`/api/sites/${siteId.value}/circuits/template`)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))

        throw new Error(errorData.message || '現場設定テンプレートの取得に失敗しました')
      }

      const ext = res.headers.get('X-Excel-Extension') || ''
      const isXlsm = ext.toLowerCase() === '.xlsm'
      const templateBuffer = await res.arrayBuffer()
      const symbolSize = 28

      if (selectedBan.value === 'ALL') {
        const zipResult = await generateExamReportsZip({
          templateBuffer,
          banMeishoList: banList.value,
          circuits: circuits.value,
          symbolSize,
          isXlsm,
          siteName: siteName.value,
          devices: selectedDevices,
        })

        const blob = new Blob([zipResult.buffer as unknown as BlobPart], { type: 'application/zip' })

        triggerBlobDownload(blob, zipResult.filename)

        message.value = {
          type: 'success',
          text: `「${zipResult.filename}」を出力しました（${banList.value.length}盤 / 合計 ${zipResult.totalCircuits}件）`,
        }
      }
      else {
        const singleBan = selectedBan.value
        const report = await generateExamReportExcel({
          templateBuffer,
          banMeisho: singleBan,
          circuits: circuits.value,
          symbolSize,
          isXlsm,
          devices: selectedDevices,
        })

        const mimeType = isXlsm
          ? 'application/vnd.ms-excel.sheet.macroEnabled.12'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        const blob = new Blob([report.buffer as unknown as BlobPart], { type: mimeType })

        triggerBlobDownload(blob, report.filename)

        message.value = {
          type: 'success',
          text: `「${report.filename}」を出力しました（対象回路: ${report.circuitsCount}件）`,
        }
      }
    }
    catch (err: unknown) {
      const errorObj = err as Error

      console.error('Report generation error:', errorObj)
      message.value = {
        type: 'error',
        text: errorObj.message || '帳票の生成に失敗しました',
      }
    }
    finally {
      isGenerating.value = false
    }
  }

  return {
    circuits,
    isLoadingCircuits,
    circuitsError,
    selectedBan,
    isGenerating,
    message,
    hasSiteSettingExcel,
    banList,
    banCircuitCountMap,
    banOptions,
    fetchCircuits,
    generateReport,
  }
}
