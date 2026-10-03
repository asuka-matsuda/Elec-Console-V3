/**
 * リモコン設定＆帳票出力 Composable
 *
 * @description 現場の回路台帳から負荷アドレスを持つ回路を抽出し、
 * グループ（G1〜G127）やパターン（P1〜P72 ON/OFF）への割り当て管理、
 * リモコン設定表テンプレートへの流し込み出力制御を提供します。
 */
import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue } from 'vue'

import { useNuxtApp } from '#app'
import type {
  RemoteCircuitItem,
  RemoteControlConfig,
  RemoteExportTarget,
  RemoteGroupSummary,
  RemotePatternSummary,
} from '#shared/types/remoteControl'
import {
  buildGroupSummaries,
  buildPatternSummaries,
  extractRemoteCircuitsFromExcel,
  generateRemoteReportExcel,
} from '~/utils/remoteReportExcel'

interface UseRemoteControlSettingOptions {
  siteName?: MaybeRefOrGetter<string>
}

export function useRemoteControlSetting(
  siteIdSource: MaybeRefOrGetter<string>,
  options: UseRemoteControlSettingOptions = {},
) {
  const { $api } = useNuxtApp()

  const siteId = computed(() => toValue(siteIdSource))
  const siteName = computed(() => toValue(options.siteName) || '現場')

  // 回路一覧（負荷アドレス付き）
  const remoteCircuits = ref<RemoteCircuitItem[]>([])
  const isLoadingData = ref(false)
  const dataError = ref<string | null>(null)

  // 設定データ
  const config = ref<RemoteControlConfig>({
    assignments: {},
    groupRemarks: {},
    patternRemarks: {},
  })
  const isSaving = ref(false)
  const saveMessage = ref<{ type: 'success' | 'error', text: string } | null>(null)

  // テンプレートファイル管理（出力対象ごとに個別管理）
  const templateFiles = ref<Record<RemoteExportTarget, File | null>>({
    address: null,
    group: null,
    pattern: null,
  })
  const templateBuffers = ref<Record<RemoteExportTarget, ArrayBuffer | null>>({
    address: null,
    group: null,
    pattern: null,
  })
  const isGenerating = ref(false)
  const generateMessage = ref<{ type: 'success' | 'error', text: string } | null>(null)

  // 伝送系統一覧
  const densoKeiToList = computed(() => {
    const set = new Set<string>()

    remoteCircuits.value.forEach((c) => {
      if (c.densoKeiTo) {
        set.add(c.densoKeiTo)
      }
    })

    return Array.from(set).sort()
  })

  // 盤名称の一覧（空き「-」は除外）
  const banList = computed(() => {
    const set = new Set<string>()

    remoteCircuits.value.forEach((c) => {
      if (c.banMeisho?.trim() && c.banMeisho !== '-') {
        set.add(c.banMeisho.trim())
      }
    })

    return Array.from(set).sort()
  })

  // グループ集計・パターン集計
  const groupSummaries = computed<RemoteGroupSummary[]>(() => {
    return buildGroupSummaries(config.value)
  })

  const patternSummaries = computed<RemotePatternSummary[]>(() => {
    return buildPatternSummaries(config.value)
  })

  // 設定済みのグループ・パターン一覧（アドレスが存在するもののみ）
  const activeGroups = computed(() => {
    return groupSummaries.value.filter(g => g.addresses.length > 0)
  })

  const activePatterns = computed(() => {
    return patternSummaries.value.filter(p => p.addresses.length > 0)
  })

  // データ初期ロード
  const fetchSiteRemoteData = async () => {
    if (!siteId.value) return
    isLoadingData.value = true
    dataError.value = null

    try {
      // 1. 設定データおよび回路スロット一覧の取得（サーバー側で原本ExcelまたはDBから自動構築）
      const res = await $api<{
        config: RemoteControlConfig
        circuits?: RemoteCircuitItem[]
      }>(`/api/sites/${siteId.value}/remote-control`)

      if (res?.config) {
        config.value = {
          assignments: res.config.assignments || {},
          groupRemarks: res.config.groupRemarks || {},
          patternRemarks: res.config.patternRemarks || {},
        }
      }

      if (res?.circuits && res.circuits.length > 0) {
        remoteCircuits.value = res.circuits
      }
      else {
        // サーバーから回路が返らなかった場合のフォールバック（ブラウザ側でのテンプレート抽出試行）
        let loadedFromExcel = false

        try {
          const resExcel = await fetch(`/api/sites/${siteId.value}/circuits/template`, {
            credentials: 'same-origin',
          })

          if (resExcel.ok) {
            const buf = await resExcel.arrayBuffer()
            const extracted = await extractRemoteCircuitsFromExcel(buf)

            if (extracted.length > 0) {
              remoteCircuits.value = extracted
              loadedFromExcel = true
            }
          }
        }
        catch {
          // ignore
        }

        if (!loadedFromExcel && remoteCircuits.value.length === 0) {
          const fallbackCircuits: RemoteCircuitItem[] = []

          for (let ch = 0; ch <= 63; ch++) {
            for (let sub = 1; sub <= 4; sub++) {
              const addr = `${ch}-${sub}`

              fallbackCircuits.push({
                id: `rc-fallback-1-${addr}`,
                siteId: siteId.value,
                uniqueKey: addr,
                densoKeiTo: '1',
                fukaAddress: addr,
                banMeisho: '-',
                kairoKigou: null,
                kairoBangou: '-',
                kairoMeisho: '空き',
                isVacant: true,
              })
            }
          }
          remoteCircuits.value = fallbackCircuits
        }
      }
    }
    catch (err: unknown) {
      const e = err as Error

      dataError.value = e.message || 'リモコン設定データの読み込みに失敗しました'
    }
    finally {
      isLoadingData.value = false
    }
  }

  // 設定の保存
  const saveRemoteConfig = async () => {
    if (!siteId.value) return
    isSaving.value = true
    saveMessage.value = null

    try {
      await $api(`/api/sites/${siteId.value}/remote-control`, {
        method: 'PUT',
        body: config.value,
      })
      saveMessage.value = { type: 'success', text: 'リモコン設定を保存しました' }
    }
    catch (err: unknown) {
      const e = err as Error

      saveMessage.value = { type: 'error', text: e.message || '保存に失敗しました' }
    }
    finally {
      isSaving.value = false
    }
  }

  // グループの一括追加・設定
  const assignGroup = (addresses: string[], groupNumber: number) => {
    addresses.forEach((addr) => {
      if (!config.value.assignments[addr]) {
        config.value.assignments[addr] = { groups: [], patterns: [] }
      }
      const gList = config.value.assignments[addr].groups || []

      if (!gList.includes(groupNumber)) {
        gList.push(groupNumber)
        gList.sort((a, b) => a - b)
        config.value.assignments[addr].groups = gList
      }
    })
  }

  // グループからの解除
  const removeGroup = (address: string, groupNumber: number) => {
    if (config.value.assignments[address]?.groups) {
      config.value.assignments[address].groups = config.value.assignments[address].groups.filter(g => g !== groupNumber)
    }
  }

  // パターンの追加・設定
  const assignPattern = (addresses: string[], patternKey: string) => {
    addresses.forEach((addr) => {
      if (!config.value.assignments[addr]) {
        config.value.assignments[addr] = { groups: [], patterns: [] }
      }
      const pList = config.value.assignments[addr].patterns || []

      if (!pList.includes(patternKey)) {
        pList.push(patternKey)
        config.value.assignments[addr].patterns = pList
      }
    })
  }

  // パターンの解除
  const removePattern = (address: string, patternKey: string) => {
    if (config.value.assignments[address]?.patterns) {
      config.value.assignments[address].patterns = config.value.assignments[address].patterns.filter(p => p !== patternKey)
    }
  }

  // 選択アドレスのクリア
  const clearSelectedAssignments = (addresses: string[]) => {
    addresses.forEach((addr) => {
      if (config.value.assignments[addr]) {
        config.value.assignments[addr] = { groups: [], patterns: [] }
      }
    })
  }

  // 出力対象ターゲット（'address' | 'group' | 'pattern'）
  const exportTarget = ref<RemoteExportTarget>('address')

  // 現在選択中の出力対象のテンプレートファイル
  const currentTemplateFile = computed(() => templateFiles.value[exportTarget.value])

  // テンプレートファイル選択（対象ごとに設定）
  const handleTemplateFileSelect = async (file: File | null, target?: RemoteExportTarget) => {
    const t = target || exportTarget.value

    templateFiles.value[t] = file
    generateMessage.value = null
    if (!file) {
      templateBuffers.value[t] = null

      return
    }

    try {
      templateBuffers.value[t] = await file.arrayBuffer()
    }
    catch {
      generateMessage.value = { type: 'error', text: 'テンプレートファイルの読み込みに失敗しました' }
    }
  }

  // Excelダウンロード実行
  const generateAndDownloadReport = async (overrideTarget?: RemoteExportTarget) => {
    if (remoteCircuits.value.length === 0) {
      generateMessage.value = { type: 'error', text: '出力対象の回路データが存在しません' }

      return
    }

    const currentExportTarget = overrideTarget || exportTarget.value
    const currentBuffer = templateBuffers.value[currentExportTarget]

    if (!currentBuffer) {
      generateMessage.value = { type: 'error', text: 'フォーマットExcelが指定されていません' }

      return
    }

    isGenerating.value = true
    generateMessage.value = null

    try {
      const result = await generateRemoteReportExcel({
        templateBuffer: currentBuffer,
        circuits: remoteCircuits.value,
        config: config.value,
        siteName: siteName.value,
        exportTarget: currentExportTarget,
      })

      const blob = new Blob([result.buffer as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      downloadBlob(blob, result.filename)

      let targetLabel = 'リモコン設定表'

      if (currentExportTarget === 'address') targetLabel = 'アドレス表'
      else if (currentExportTarget === 'group') targetLabel = 'グループ設定表'
      else if (currentExportTarget === 'pattern') targetLabel = 'パターン設定表'

      generateMessage.value = {
        type: 'success',
        text: `${targetLabel}を出力しました（${result.totalAddresses}件 / ${result.configuredGroups}グループ）`,
      }
    }
    catch (err: unknown) {
      const e = err as Error

      generateMessage.value = { type: 'error', text: e.message || '出力中にエラーが発生しました' }
    }
    finally {
      isGenerating.value = false
    }
  }

  return {
    remoteCircuits,
    banList,
    densoKeiToList,
    config,
    isLoadingData,
    dataError,
    isSaving,
    saveMessage,
    groupSummaries,
    patternSummaries,
    activeGroups,
    activePatterns,
    templateFiles,
    templateFile: currentTemplateFile,
    exportTarget,
    isGenerating,
    generateMessage,
    fetchSiteRemoteData,
    saveRemoteConfig,
    assignGroup,
    removeGroup,
    assignPattern,
    removePattern,
    clearSelectedAssignments,
    handleTemplateFileSelect,
    generateAndDownloadReport,
  }
}
