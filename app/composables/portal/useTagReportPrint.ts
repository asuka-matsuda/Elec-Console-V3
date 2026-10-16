/**
 * タグ・線名札 Excel 帳票出力 Composable
 *
 * @description 回路台帳Excelからの動的見出し抽出、A4定型テンプレートへの差し込み生成、
 * 系統（幹線/二次）や盤によるフィルタリング、およびダウンロード制御を提供します。
 */
import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue, watch } from 'vue'

import { useNuxtApp } from '#app'
import type { CircuitsResponse } from '#shared/types/circuit'
import { useAuth } from '~/composables/useAuth'
import type { SelectOption } from '~/types/components'
import { formatToDateInputString } from '~/utils/date'
import { CircuitsRepository } from '~/utils/db'
import {
  convertCircuitsToDynamicRows,
  type DynamicCircuitRow,
  type DynamicTagField,
} from '~/utils/tagReportExcel'

export function useTagReportPrint(
  siteIdSource: MaybeRefOrGetter<string>,
) {
  const { $api } = useNuxtApp()
  const { getAccurateNow } = useAuth()

  const siteId = computed(() => toValue(siteIdSource))
  const exportDate = computed(() => formatToDateInputString(getAccurateNow()))

  // 動的テーブルデータ
  const dynamicHeaders = ref<DynamicTagField[]>([])
  const dynamicRows = ref<DynamicCircuitRow[]>([])

  const isLoadingData = ref(true)

  // 絞り込み条件（系統、盤種別、盤名称、幹線可否）
  const selectedKeiTo = ref<string>('ALL')
  const selectedBanShubetsu = ref<string>('ALL')
  const selectedBan = ref<string>('ALL')
  const selectedKansen = ref<'ALL' | '幹線' | '二次'>('ALL')
  const flowDirection = ref<'z' | 'n'>('z')

  // 1. 系統の一覧・選択肢
  const keiToList = computed(() => {
    const set = new Set<string>()

    for (const r of dynamicRows.value) {
      if (r.keiToName?.trim()) {
        set.add(r.keiToName.trim())
      }
    }

    return Array.from(set).sort()
  })

  const keiToOptions = computed<SelectOption[]>(() => [
    { value: 'ALL', label: `全系統 (${keiToList.value.length})` },
    ...keiToList.value.map(k => ({
      value: k,
      label: k,
    })),
  ])

  // 2. 盤種別の一覧・選択肢（系統に連動）
  const banShubetsuList = computed(() => {
    const set = new Set<string>()

    for (const r of dynamicRows.value) {
      if (selectedKeiTo.value !== 'ALL' && r.keiToName && r.keiToName !== selectedKeiTo.value) {
        continue
      }
      if (r.banShubetsu?.trim()) {
        set.add(r.banShubetsu.trim())
      }
    }

    return Array.from(set).sort()
  })

  const banShubetsuOptions = computed<SelectOption[]>(() => [
    { value: 'ALL', label: `全種別 (${banShubetsuList.value.length})` },
    ...banShubetsuList.value.map(s => ({
      value: s,
      label: s,
    })),
  ])

  // 3. 盤名称の一覧・選択肢（系統および盤種別に連動）
  const banList = computed(() => {
    const set = new Set<string>()

    for (const r of dynamicRows.value) {
      if (selectedKeiTo.value !== 'ALL' && r.keiToName && r.keiToName !== selectedKeiTo.value) {
        continue
      }
      if (selectedBanShubetsu.value !== 'ALL' && r.banShubetsu && r.banShubetsu !== selectedBanShubetsu.value) {
        continue
      }
      if (r.banMeisho?.trim()) {
        set.add(r.banMeisho.trim())
      }
    }

    return Array.from(set).sort()
  })

  const banCountMap = computed(() => {
    const map = new Map<string, number>()

    for (const r of dynamicRows.value) {
      if (selectedKeiTo.value !== 'ALL' && r.keiToName && r.keiToName !== selectedKeiTo.value) {
        continue
      }
      if (selectedBanShubetsu.value !== 'ALL' && r.banShubetsu && r.banShubetsu !== selectedBanShubetsu.value) {
        continue
      }
      const ban = r.banMeisho?.trim()

      if (ban) {
        map.set(ban, (map.get(ban) || 0) + 1)
      }
    }

    return map
  })

  const banOptions = computed<SelectOption[]>(() => [
    {
      value: 'ALL',
      label: `全盤 (${banList.value.length}盤)`,
    },
    ...banList.value.map(ban => ({
      value: ban,
      label: `${ban} (${banCountMap.value.get(ban) || 0})`,
    })),
  ])

  // 上位フィルター変更時に選択肢が無効になった場合の安全なリセット
  watch(banShubetsuList, (validList) => {
    if (selectedBanShubetsu.value !== 'ALL' && !validList.includes(selectedBanShubetsu.value)) {
      selectedBanShubetsu.value = 'ALL'
    }
  })

  watch(banList, (validList) => {
    if (selectedBan.value !== 'ALL' && !validList.includes(selectedBan.value)) {
      selectedBan.value = 'ALL'
    }
  })

  // 4. 幹線可否の選択肢
  const kansenOptions: SelectOption[] = [
    { value: 'ALL', label: 'すべて（幹線・二次）' },
    { value: '幹線', label: '幹線のみ' },
    { value: '二次', label: '二次側のみ' },
  ]

  // 流し込み順選択肢
  const flowDirectionOptions: SelectOption[] = [
    { value: 'z', label: '行優先 (Z順)' },
    { value: 'n', label: '列優先 (N順)' },
  ]

  // 絞り込み後の行データ
  const filteredRows = computed(() => {
    return dynamicRows.value.filter((r) => {
      // 1. 系統
      if (selectedKeiTo.value !== 'ALL' && r.keiToName && r.keiToName !== selectedKeiTo.value) {
        return false
      }

      // 2. 盤種別
      if (selectedBanShubetsu.value !== 'ALL' && r.banShubetsu && r.banShubetsu !== selectedBanShubetsu.value) {
        return false
      }

      // 3. 盤名称
      if (selectedBan.value !== 'ALL' && r.banMeisho !== selectedBan.value) {
        return false
      }

      // 4. 幹線可否
      if (selectedKansen.value !== 'ALL') {
        const isTarget = selectedKansen.value === '幹線'
          ? r.keiTo.includes('幹線')
          : !r.keiTo.includes('幹線')

        if (!isTarget) return false
      }

      return true
    })
  })

  // 現場データ（回路データ）の読み込み (Local-First: IndexedDB即座反映 -> 高速API同期)
  const fetchSiteData = async () => {
    if (!siteId.value) {
      isLoadingData.value = false

      return
    }
    isLoadingData.value = true

    try {
      // 1. IndexedDB からローカル回路を即座に読み込み
      try {
        const local = await CircuitsRepository.getBySite(siteId.value)

        if (local && local.length > 0) {
          const converted = convertCircuitsToDynamicRows(local, exportDate.value)

          dynamicHeaders.value = converted.headers
          dynamicRows.value = converted.rows
        }
      }
      catch (err) {
        console.warn('[useTagReportPrint] Local circuits load failed', err)
      }

      // 2. サーバーAPIから最新の回路データを高速JSON取得して同期
      try {
        const res = await $api<CircuitsResponse>(`/api/sites/${siteId.value}/circuits`)

        if (res && res.circuits && res.circuits.length > 0) {
          await CircuitsRepository.replaceForSite(siteId.value, res.circuits)
          const converted = convertCircuitsToDynamicRows(res.circuits, exportDate.value)

          dynamicHeaders.value = converted.headers
          dynamicRows.value = converted.rows
        }
      }
      catch {
        // オフラインまたはエラー時はローカルキャッシュを維持
      }
    }
    finally {
      isLoadingData.value = false
    }
  }

  return {
    filteredRows,
    isLoadingData,
    selectedKeiTo,
    selectedBanShubetsu,
    selectedBan,
    selectedKansen,
    flowDirection,
    banOptions,
    keiToOptions,
    banShubetsuOptions,
    kansenOptions,
    flowDirectionOptions,
    fetchSiteData,
  }
}
