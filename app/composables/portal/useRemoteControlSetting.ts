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
import type { CircuitItem } from '#shared/types/circuit'
import type {
  RemoteCircuitItem,
  RemoteControlConfig,
  RemoteGroupSummary,
  RemotePatternSummary,
} from '#shared/types/remoteControl'
import { CircuitsRepository } from '~/utils/db'
import { getErrorMessage } from '~/utils/errors'
import {
  buildGroupSummaries,
  buildPatternSummaries,
} from '~/utils/remoteReportExcel'

export function useRemoteControlSetting(
  siteIdSource: MaybeRefOrGetter<string>,
) {
  const { $api } = useNuxtApp()

  const siteId = computed(() => toValue(siteIdSource))

  // 回路一覧（負荷アドレス付き）
  const remoteCircuits = ref<RemoteCircuitItem[]>([])
  const isLoadingData = ref(true)
  const dataError = ref<string | null>(null)

  // 設定データ
  const config = ref<RemoteControlConfig>({
    assignments: {},
    groupRemarks: {},
    patternRemarks: {},
  })
  const isSaving = ref(false)

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
    if (!siteId.value) {
      isLoadingData.value = false

      return
    }

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
        // サーバーから回路が返らなかった場合のフォールバック（IndexedDBローカル回路からスロット構築）
        let localCircuits: CircuitItem[] = []

        try {
          localCircuits = await CircuitsRepository.getBySite(siteId.value)
        }
        catch {
          // ignore
        }

        const circuitMap = new Map<string, CircuitItem>()

        for (const c of localCircuits) {
          const addr = c.fukaAddress?.trim()

          if (addr) {
            circuitMap.set(addr, c)
          }
        }

        const fallbackCircuits: RemoteCircuitItem[] = []

        for (let ch = 0; ch <= 63; ch++) {
          for (let sub = 1; sub <= 4; sub++) {
            const addr = `${ch}-${sub}`
            const matched = circuitMap.get(addr)

            fallbackCircuits.push({
              id: `rc-fallback-1-${addr}`,
              siteId: siteId.value,
              uniqueKey: addr,
              densoKeiTo: matched?.densoKeiTo || '1',
              fukaAddress: addr,
              banMeisho: matched?.banMeisho || '-',
              kairoKigou: matched?.kairoKigou || null,
              kairoBangou: matched?.kairoBangou || '-',
              kairoMeisho: matched?.kairoMeisho || (matched ? '-' : '空き'),
              isVacant: !matched,
            })
          }
        }
        remoteCircuits.value = fallbackCircuits
      }
    }
    catch (err: unknown) {
      dataError.value = getErrorMessage(err, 'リモコン設定データの読み込みに失敗しました')
    }
    finally {
      isLoadingData.value = false
    }
  }

  // 設定の保存
  const saveRemoteConfig = async () => {
    if (!siteId.value) return
    isSaving.value = true
    const toast = useToast()

    try {
      await $api(`/api/sites/${siteId.value}/remote-control`, {
        method: 'PUT',
        body: config.value,
      })
      toast.success('リモコン設定を保存しました')
    }
    catch (err: unknown) {
      const msg = getErrorMessage(err, '保存に失敗しました')

      toast.error(msg)
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

  return {
    remoteCircuits,
    banList,
    densoKeiToList,
    config,
    isLoadingData,
    dataError,
    isSaving,
    activeGroups,
    activePatterns,
    fetchSiteRemoteData,
    saveRemoteConfig,
    assignGroup,
    removeGroup,
    assignPattern,
    removePattern,
    clearSelectedAssignments,
  }
}
