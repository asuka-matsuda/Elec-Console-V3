/**
 * コンセント用テプラ（TEPRA）帳票出力 Composable
 *
 * @description 原本Excel（データベース.xlsm）から見出し検索で受口数のある回路を取得し、
 * 盤名称・回路記号での絞り込み、受口数による行複製、盤ごとのシート分割Excel出力を提供します。
 */

import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue } from 'vue'

import { useNuxtApp } from '#app'
import type { TepraCircuitItem } from '#shared/types/socketTepra'
import type { SelectOption } from '~/types/components'
import { downloadBlob } from '~/utils/download'
import { generateSocketTepraExcel } from '~/utils/socketTepraExcel'

interface UseSocketTepraPrintOptions {
  siteName?: MaybeRefOrGetter<string>
}

export function useSocketTepraPrint(
  siteIdSource: MaybeRefOrGetter<string>,
  options: UseSocketTepraPrintOptions = {},
) {
  const { $api } = useNuxtApp()
  const toast = useToast()

  const siteId = computed(() => toValue(siteIdSource))
  const siteName = computed(() => toValue(options.siteName) || '現場')

  const rawCircuits = ref<TepraCircuitItem[]>([])
  const isLoadingData = ref(true)
  const hasExcelPath = ref(false)

  // 絞り込み条件（盤名称、回路記号）
  const selectedBan = ref<string>('ALL')
  const selectedKairoKigou = ref<string>('ALL')
  const isExporting = ref(false)

  // 1. 盤名称一覧・選択肢
  const banList = computed(() => {
    const set = new Set<string>()

    for (const c of rawCircuits.value) {
      if (c.banMeisho?.trim()) {
        set.add(c.banMeisho.trim())
      }
    }

    return Array.from(set).sort()
  })

  const banOptions = computed<SelectOption[]>(() => {
    const allTotalRows = rawCircuits.value.reduce((acc, c) => acc + c.ukeguchiCount, 0)

    return [
      {
        value: 'ALL',
        label: `全盤対象 (${banList.value.length}盤 / 計${allTotalRows}枚)`,
      },
      ...banList.value.map((ban) => {
        const banCircuits = rawCircuits.value.filter(c => c.banMeisho === ban)
        const banRows = banCircuits.reduce((acc, c) => acc + c.ukeguchiCount, 0)

        return {
          value: ban,
          label: `${ban} (${banCircuits.length}回路 / ${banRows}枚)`,
        }
      }),
    ]
  })

  // 2. 回路記号一覧・選択肢（選択中の盤に連動）
  const kairoKigouList = computed(() => {
    const set = new Set<string>()

    for (const c of rawCircuits.value) {
      if (selectedBan.value !== 'ALL' && c.banMeisho !== selectedBan.value) {
        continue
      }
      const kigou = c.kairoKigou?.trim()

      if (kigou) {
        set.add(kigou)
      }
    }

    return Array.from(set).sort()
  })

  const kairoKigouOptions = computed<SelectOption[]>(() => [
    { value: 'ALL', label: 'すべての記号' },
    ...kairoKigouList.value.map(kigou => ({
      value: kigou,
      label: `記号: ${kigou}`,
    })),
  ])

  // 3. 絞り込み後の対象回路
  const filteredCircuits = computed(() => {
    return rawCircuits.value.filter((c) => {
      if (selectedBan.value !== 'ALL' && c.banMeisho !== selectedBan.value) {
        return false
      }
      if (selectedKairoKigou.value !== 'ALL') {
        const kigou = c.kairoKigou?.trim() || ''

        if (kigou !== selectedKairoKigou.value) {
          return false
        }
      }

      return true
    })
  })

  // 4. 出力集計サマリー
  const summary = computed(() => {
    const circuits = filteredCircuits.value
    const totalRows = circuits.reduce((acc, c) => acc + c.ukeguchiCount, 0)
    const uniqueBans = new Set(circuits.map(c => c.banMeisho)).size

    return {
      totalCircuits: circuits.length,
      totalSheets: uniqueBans,
      totalRows, // テプラ印刷枚数（転記行数）
    }
  })

  const canExport = computed(() => {
    return summary.value.totalRows > 0 && !isExporting.value && !isLoadingData.value
  })

  const exportButtonLabel = computed(() => {
    if (isLoadingData.value) return 'データ読込中...'
    if (summary.value.totalRows === 0) return '出力対象の回路がありません'

    const sheetText = summary.value.totalSheets === 1 ? '1盤' : `${summary.value.totalSheets}盤`

    return `${sheetText} (${summary.value.totalRows}枚) を出力する`
  })

  // 現場データ（受口数のあるテプラ回路）の読み込み
  const fetchTepraCircuits = async () => {
    if (!siteId.value) {
      isLoadingData.value = false

      return
    }

    isLoadingData.value = true

    try {
      const res = await $api<{
        success: boolean
        circuits: TepraCircuitItem[]
        hasExcelPath: boolean
      }>(`/api/sites/${siteId.value}/tepra-circuits`)

      rawCircuits.value = res.circuits || []
      hasExcelPath.value = res.hasExcelPath || false
    }
    catch {
      // ignore
    }
    finally {
      isLoadingData.value = false
    }
  }

  // Excel出力の実行
  const exportReport = async () => {
    if (!canExport.value) return

    isExporting.value = true
    try {
      const result = await generateSocketTepraExcel({
        circuits: filteredCircuits.value,
        selectedBan: selectedBan.value,
        selectedKairoKigou: selectedKairoKigou.value,
        siteName: siteName.value,
      })

      const blob = new Blob([result.buffer as unknown as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      downloadBlob(blob, result.filename)
      toast.success(`${result.totalSheets}盤・計${result.totalRows}枚のテプラ用Excelを出力しました`)
    }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'テプラExcelの生成に失敗しました'

      toast.error(msg)
    }
    finally {
      isExporting.value = false
    }
  }

  return {
    filteredCircuits,
    isLoadingData,
    hasExcelPath,
    selectedBan,
    banOptions,
    selectedKairoKigou,
    kairoKigouOptions,
    summary,
    canExport,
    isExporting,
    exportButtonLabel,
    fetchTepraCircuits,
    exportReport,
  }
}
