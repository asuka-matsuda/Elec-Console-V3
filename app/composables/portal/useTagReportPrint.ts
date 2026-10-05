/**
 * タグ・線名札 Excel 帳票出力 Composable
 *
 * @description 回路台帳Excelからの動的見出し抽出、A4定型テンプレートへの差し込み生成、
 * 系統（幹線/二次）や盤によるフィルタリング、およびダウンロード制御を提供します。
 */
import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue } from 'vue'

import { useNuxtApp } from '#app'
import type { CircuitItem } from '#shared/types/circuit'
import { useAuth } from '~/composables/useAuth'
import type { SelectOption } from '~/types/components'
import { formatToDateInputString } from '~/utils/date'
import { CircuitsRepository } from '~/utils/db'
import {
  convertCircuitsToDynamicRows,
  type DynamicCircuitRow,
  type DynamicTagField,
  extractTableFromExcel,
  generateTagReportExcel,
} from '~/utils/tagReportExcel'

interface UseTagReportPrintOptions {
  siteName?: MaybeRefOrGetter<string>
}

export function useTagReportPrint(
  siteIdSource: MaybeRefOrGetter<string>,
  options: UseTagReportPrintOptions = {},
) {
  const { $api } = useNuxtApp()
  const { getAccurateNow } = useAuth()

  const siteId = computed(() => toValue(siteIdSource))
  const siteName = computed(() => toValue(options.siteName) || '現場')
  const exportDate = computed(() => formatToDateInputString(getAccurateNow()))

  // 回路データおよび動的テーブルデータ
  const rawCircuits = ref<CircuitItem[]>([])
  const dynamicHeaders = ref<DynamicTagField[]>([])
  const dynamicRows = ref<DynamicCircuitRow[]>([])

  const isLoadingData = ref(false)
  const dataError = ref<string | null>(null)

  // ユーザーがアップロードしたA4タグ用テンプレート
  const templateFile = ref<File | null>(null)
  const templateBuffer = ref<ArrayBuffer | null>(null)

  // 絞り込み条件
  const selectedKeiTo = ref<'幹線' | 'ALL' | '二次'>('幹線')
  const selectedBan = ref<string>('ALL')
  const flowDirection = ref<'z' | 'n'>('z')

  // 出力処理状態
  const isGenerating = ref(false)
  const message = ref<{ type: 'success' | 'error', text: string } | null>(null)

  // 系統選択肢
  const keiToOptions: SelectOption[] = [
    { value: '幹線', label: '幹線のみ（推奨）' },
    { value: 'ALL', label: 'すべての系統（幹線・二次）' },
    { value: '二次', label: '二次側のみ' },
  ]

  // 流し込み順選択肢
  const flowDirectionOptions: SelectOption[] = [
    { value: 'z', label: '左から右へ (Z順: 行優先)' },
    { value: 'n', label: '上から下へ (N順: 列優先)' },
  ]

  // 盤名称の一覧
  const banList = computed(() => {
    const set = new Set<string>()

    for (const r of dynamicRows.value) {
      if (r.banMeisho?.trim()) {
        set.add(r.banMeisho.trim())
      }
    }

    return Array.from(set).sort()
  })

  // 盤ごとの件数マップ
  const banCountMap = computed(() => {
    const map = new Map<string, number>()

    for (const r of dynamicRows.value) {
      const ban = r.banMeisho?.trim()

      if (ban) {
        map.set(ban, (map.get(ban) || 0) + 1)
      }
    }

    return map
  })

  // 盤選択肢
  const banOptions = computed<SelectOption[]>(() => [
    {
      value: 'ALL',
      label: `全盤対象 (${banList.value.length}盤 / ${dynamicRows.value.length}回路)`,
    },
    ...banList.value.map(ban => ({
      value: ban,
      label: `${ban} (${banCountMap.value.get(ban) || 0}回路)`,
    })),
  ])

  // 絞り込み後の行データ
  const filteredRows = computed(() => {
    return dynamicRows.value.filter((r) => {
      // 系統フィルタ
      if (selectedKeiTo.value !== 'ALL') {
        const isTarget = selectedKeiTo.value === '幹線'
          ? r.keiTo.includes('幹線')
          : !r.keiTo.includes('幹線')

        if (!isTarget) return false
      }

      // 盤フィルタ
      if (selectedBan.value !== 'ALL') {
        if (r.banMeisho !== selectedBan.value) return false
      }

      return true
    })
  })

  // サマリー集計
  const summary = computed(() => {
    let kansen = 0
    let secondary = 0

    for (const r of dynamicRows.value) {
      if (r.keiTo.includes('幹線')) {
        kansen++
      }
      else {
        secondary++
      }
    }

    return {
      total: dynamicRows.value.length,
      kansen,
      secondary,
      filteredTotal: filteredRows.value.length,
    }
  })

  // 現場データ（Excel台帳および回路）の読み込み
  const fetchSiteData = async () => {
    if (!siteId.value) return
    isLoadingData.value = true
    dataError.value = null

    // 1. IndexedDB からローカル回路を即座に読み込み（フォールバック用）
    try {
      const local = await CircuitsRepository.getBySite(siteId.value)

      if (local && local.length > 0) {
        rawCircuits.value = local
        const converted = convertCircuitsToDynamicRows(local, exportDate.value)

        dynamicHeaders.value = converted.headers
        dynamicRows.value = converted.rows
      }
    }
    catch (err) {
      console.warn('[useTagReportPrint] Local circuits load failed', err)
    }

    // 2. 現場設定にExcel原本があれば、サーバーから取得して完全な動的ヘッダーと行データを抽出
    let excelLoaded = false

    try {
      const res = await fetch(`/api/sites/${siteId.value}/circuits/template`)

      if (res.ok) {
        const buf = await res.arrayBuffer()
        const extracted = await extractTableFromExcel(buf)

        if (extracted.headers.length > 0 && extracted.rows.length > 0) {
          dynamicHeaders.value = extracted.headers
          dynamicRows.value = extracted.rows
          excelLoaded = true
        }
      }
    }
    catch (err) {
      console.info('[useTagReportPrint] No template excel or failed to load, fallback to DB circuits', err)
    }

    // 3. Excel原本が未ロードの場合、最新の回路APIからデータを取得して更新
    if (!excelLoaded) {
      try {
        const res = await $api<{ circuits: CircuitItem[] }>(`/api/sites/${siteId.value}/circuits`)

        if (res && res.circuits) {
          rawCircuits.value = res.circuits
          await CircuitsRepository.putAll(res.circuits)
          const converted = convertCircuitsToDynamicRows(res.circuits, exportDate.value)

          dynamicHeaders.value = converted.headers
          dynamicRows.value = converted.rows
        }
      }
      catch (err: unknown) {
        if (dynamicRows.value.length === 0) {
          const e = err as Error

          dataError.value = e.message || '回路データの取得に失敗しました'
        }
      }
    }

    isLoadingData.value = false
  }

  // ユーザーによるテンプレートExcelファイルの選択
  const handleTemplateFileSelect = async (file: File | null) => {
    templateFile.value = file
    message.value = null
    if (!file) {
      templateBuffer.value = null

      return
    }

    try {
      const buffer = await file.arrayBuffer()

      templateBuffer.value = buffer
    }
    catch (err) {
      console.error('Failed to read template file buffer', err)
      message.value = { type: 'error', text: 'テンプレートファイルの読み込みに失敗しました' }
    }
  }

  // タグ帳票生成実行
  const generateReport = async () => {
    if (!templateBuffer.value) {
      message.value = {
        type: 'error',
        text: 'タグ印刷用のフォーマット（テンプレートExcel）を選択してください',
      }

      return
    }

    if (filteredRows.value.length === 0) {
      message.value = {
        type: 'error',
        text: '選択された条件に一致する出力対象データがありません',
      }

      return
    }

    isGenerating.value = true
    message.value = null

    try {
      const result = await generateTagReportExcel({
        templateBuffer: templateBuffer.value,
        rows: filteredRows.value,
        siteName: siteName.value,
        exportDate: exportDate.value,
        flowDirection: flowDirection.value,
      })

      const blob = new Blob([result.buffer as unknown as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      downloadBlob(blob, result.filename)

      message.value = {
        type: 'success',
        text: `${result.totalTags}件のタグ（全${result.totalPages}ページ）を出力しました`,
      }
    }
    catch (err: unknown) {
      const e = err as Error

      console.error('Tag report generation failed', e)
      message.value = {
        type: 'error',
        text: e.message || 'タグ帳票の生成に失敗しました',
      }
    }
    finally {
      isGenerating.value = false
    }
  }

  return {
    siteId,
    siteName,
    dynamicHeaders,
    dynamicRows,
    filteredRows,
    isLoadingData,
    dataError,
    templateFile,
    selectedKeiTo,
    selectedBan,
    flowDirection,
    isGenerating,
    message,
    banList,
    banOptions,
    keiToOptions,
    flowDirectionOptions,
    summary,
    fetchSiteData,
    handleTemplateFileSelect,
    generateReport,
  }
}
