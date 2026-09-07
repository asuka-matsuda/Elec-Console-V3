import type { Ref } from 'vue'
import { computed, ref, unref } from 'vue'

import { useOfflineSync } from '~/composables/portal/useOfflineSync'
import { useAuth } from '~/composables/useAuth'
import type { CircuitItem, CircuitsResponse, PanelOption } from '~/types/souden'

export function usePhaseExam(
  siteIdRef: Ref<string> | string,
  initialKeiTo: string = '幹線',
  phaseNumber: number = 1,
) {
  const { getAccurateNow, currentUser } = useAuth()
  const { enqueue } = useOfflineSync(siteIdRef)

  const circuits = ref<CircuitItem[]>([])
  const panelOptions = ref<PanelOption[]>([])
  const panelsWithIncompleteKansen = ref<string[]>([])
  const phase2ThresholdMegOhm = ref<number>(1.0)
  const isLoading = ref(false)
  const isActionLoading = ref<Record<string, boolean>>({})
  const isBatchLoading = ref(false)
  const error = ref<string | null>(null)

  const selectedKeiTo = ref<string>(initialKeiTo)
  const selectedBanShubetsu = ref<string>('ALL')
  const selectedBanMeisho = ref<string>('ALL')

  const editingRowId = ref<string | null>(null)
  const editForm = ref<Record<string, string>>({})

  // ネットワーク・圏外エラー判定ヘルパー
  const isNetworkError = (err: unknown): boolean => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return true
    }

    const e = err as { name?: string, message?: string, statusCode?: number }

    if (e?.name === 'TypeError' && (e?.message?.includes('fetch') || e?.message?.includes('Network'))) {
      return true
    }

    if (e?.name === 'FetchError' && !e?.statusCode) {
      return true
    }

    return false
  }

  const fetchCircuits = async () => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()

      if (selectedKeiTo.value && selectedKeiTo.value !== 'ALL') {
        params.append('keiTo', selectedKeiTo.value)
      }

      const res = await $fetch<CircuitsResponse>(
        `/api/sites/${siteId}/circuits?${params.toString()}`,
      )

      if (res) {
        circuits.value = res.circuits || []
        panelOptions.value = res.panelOptions || []
        panelsWithIncompleteKansen.value = res.panelsWithIncompleteKansen || []
        if (typeof res.phase2ThresholdMegOhm === 'number') {
          phase2ThresholdMegOhm.value = res.phase2ThresholdMegOhm
        }
      }
    }
    catch (err: unknown) {
      const e = err as Error

      error.value = e.message || '通信エラーが発生しました'
    }
    finally {
      isLoading.value = false
    }
  }

  // 盤種別の選択肢リスト
  const availableShubetsuList = computed(() => {
    const set = new Set<string>()

    panelOptions.value.forEach(p => set.add(p.banShubetsu))

    return ['ALL', ...Array.from(set)]
  })

  // 選択された種別に属する盤名称の選択肢リスト
  const availableBanMeishoList = computed(() => {
    const filtered = selectedBanShubetsu.value === 'ALL'
      ? panelOptions.value
      : panelOptions.value.filter(p => p.banShubetsu === selectedBanShubetsu.value)

    const set = new Set<string>()

    filtered.forEach((p) => {
      if (p.banMeisho) {
        set.add(p.banMeisho)
      }
    })

    const sorted = Array.from(set).sort((a, b) =>
      a.localeCompare(b, 'ja', { numeric: true, sensitivity: 'base' }),
    )

    const list = sorted.map(m => ({ label: m, value: m }))

    return [{ label: 'すべての盤', value: 'ALL' }, ...list]
  })

  // クライアント側での盤フィルタ適用後の回路一覧
  const filteredCircuits = computed(() => {
    return circuits.value.filter((c) => {
      if (selectedBanShubetsu.value !== 'ALL' && c.banShubetsu !== selectedBanShubetsu.value) {
        return false
      }

      if (selectedBanMeisho.value !== 'ALL' && c.banMeisho !== selectedBanMeisho.value) {
        return false
      }

      return true
    })
  })

  // 回路が三相・動力系かどうかの判定
  const isThreePhase = (c: CircuitItem): boolean => {
    const h = (c.haidenHoushiki || '').toLowerCase()
    const s = (c.souShubetsu || '').toLowerCase()
    const k = (c.kairoMeisho || '').toLowerCase()

    return (
      h.includes('3φ')
      || h.includes('3相')
      || h.includes('三相')
      || h.includes('動力')
      || s.includes('3φ')
      || s.includes('3相')
      || s.includes('三相')
      || s.includes('動力')
      || k.includes('動力')
    )
  }

  // 測定値に基づくOK/NG判定
  const evalMegStatus = (val: number | string | null | undefined): 'OK' | 'NG' | null => {
    if (val === null || val === undefined || val === '') return null
    const num = typeof val === 'number' ? val : parseFloat(String(val))

    if (isNaN(num)) return null

    return num >= phase2ThresholdMegOhm.value ? 'OK' : 'NG'
  }

  // フィルタ後の進捗統計
  const phaseStats = computed(() => {
    const list = filteredCircuits.value
    let completed = 0
    let excluded = 0
    let total = 0

    for (const c of list) {
      if (c.isExcluded) {
        excluded++
      }
      else {
        total++
        if (phaseNumber === 1 && c.p1ConfirmedAt && c.p1Kakunin && c.p1Mashishime) {
          completed++
        }
        else if (phaseNumber === 2 && c.p2ConfirmedAt && c.p2IsComplete) {
          completed++
        }
        else if (phaseNumber === 3 && c.p3ConfirmedAt) {
          completed++
        }
      }
    }

    const pct = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      allCount: list.length,
      total,
      completed,
      excluded,
      pct,
    }
  })

  // 該当する二次側回路が操作不可（幹線未完了）かどうか
  const isCircuitLocked = (circuit: CircuitItem): boolean => {
    return circuit.keiTo === '二次側' && panelsWithIncompleteKansen.value.includes(circuit.banMeisho)
  }

  // 行の編集開始
  const startEdit = (row: CircuitItem) => {
    editingRowId.value = row.id
    editForm.value = {
      kairoBangou: row.kairoBangou || '',
      kairoMeisho: row.kairoMeisho || '',
      cableList: row.cableList || '',
      haisenJousuu: row.haisenJousuu || '',
      setsuchiList: row.setsuchiList || '',
      remarks: row.p1Remarks || '',
    }
  }

  // 行の編集キャンセル
  const cancelEdit = () => {
    editingRowId.value = null
    editForm.value = {}
  }

  // 排他制御 (409 Conflict) エラーの共通ハンドリング
  const handleConflictError = (circuitId: string, err: unknown): boolean => {
    const fetchErr = err as {
      statusCode?: number
      status?: number
      data?: {
        message?: string
        data?: { currentCircuit?: CircuitItem }
      }
    }

    const isConflict = fetchErr?.statusCode === 409 || fetchErr?.status === 409

    if (isConflict) {
      const current = fetchErr.data?.data?.currentCircuit

      if (current) {
        const idx = circuits.value.findIndex(c => c.id === circuitId)

        if (idx !== -1) {
          circuits.value[idx] = {
            ...circuits.value[idx],
            ...current,
          }
        }
      }

      alert(
        fetchErr.data?.message
        || '他の作業員によってこの回路が更新されました。最新状態を反映しました。',
      )

      return true
    }

    return false
  }

  // Phase 1 確定実行
  const confirmPhase1 = async (
    circuit: CircuitItem,
    overrideData?: {
      kakunin?: boolean
      mashishime?: boolean
      remarks?: string
      modifiedFields?: string[]
      [key: string]: unknown
    },
  ) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    isActionLoading.value[circuit.id] = true

    const clientConfirmedAt = getAccurateNow().toISOString()
    const workerName = currentUser.value
      ? `${currentUser.value.lastName} ${currentUser.value.firstName}`.trim() || currentUser.value.loginId
      : '現場作業員'

    const payload = {
      kakunin: overrideData?.kakunin ?? circuit.p1Kakunin ?? true,
      mashishime: overrideData?.mashishime ?? circuit.p1Mashishime ?? true,
      remarks: overrideData?.remarks ?? circuit.p1Remarks ?? '',
      modifiedFields: overrideData?.modifiedFields ?? [],
      expectedUpdatedAt: circuit.updatedAt,
      ...overrideData,
    }

    try {
      const res = await $fetch<{ success: boolean, circuit: CircuitItem }>(
        `/api/sites/${siteId}/circuits/${circuit.id}/phase1`,
        {
          method: 'POST',
          body: {
            ...payload,
            clientConfirmedAt,
          },
        },
      )

      if (res.circuit) {
        const idx = circuits.value.findIndex(c => c.id === circuit.id)

        if (idx !== -1) {
          circuits.value[idx] = {
            ...circuits.value[idx],
            ...res.circuit,
          }
        }
      }

      cancelEdit()

      return res
    }
    catch (err: unknown) {
      if (handleConflictError(circuit.id, err)) {
        return
      }

      if (isNetworkError(err)) {
        enqueue({
          siteId,
          circuitId: circuit.id,
          banMeisho: circuit.banMeisho,
          kairoBangou: circuit.kairoBangou || '',
          kairoMeisho: circuit.kairoMeisho || '',
          phase: 1,
          actionType: 'confirm',
          payload,
          clientConfirmedAt,
          expectedUpdatedAt: circuit.updatedAt,
          workerName,
        })

        const idx = circuits.value.findIndex(c => c.id === circuit.id)
        const target = circuits.value[idx]

        if (idx !== -1 && target) {
          circuits.value[idx] = {
            ...target,
            p1Kakunin: Boolean(payload.kakunin),
            p1Mashishime: Boolean(payload.mashishime),
            p1Remarks: String(payload.remarks || ''),
            p1Worker: workerName,
            p1ConfirmedAt: clientConfirmedAt,
          }
        }

        cancelEdit()

        return { success: true, isOffline: true }
      }

      const e = err as Error

      alert(`確定に失敗しました: ${e.message}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // Phase 1 確定解除
  const clearPhase1 = async (circuit: CircuitItem) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    if (!confirm(`盤「${circuit.banMeisho}」回路「${circuit.kairoBangou || circuit.kairoMeisho}」のフェーズ1確定を解除しますか？`)) {
      return
    }

    isActionLoading.value[circuit.id] = true

    const clientConfirmedAt = getAccurateNow().toISOString()

    try {
      const res = await $fetch<{ success: boolean, circuit: CircuitItem }>(
        `/api/sites/${siteId}/circuits/${circuit.id}/phase1/clear`,
        {
          method: 'POST',
          body: {
            expectedUpdatedAt: circuit.updatedAt,
            clientConfirmedAt,
          },
        },
      )

      if (res.circuit) {
        const idx = circuits.value.findIndex(c => c.id === circuit.id)

        if (idx !== -1) {
          circuits.value[idx] = {
            ...circuits.value[idx],
            ...res.circuit,
          }
        }
      }

      return res
    }
    catch (err: unknown) {
      if (handleConflictError(circuit.id, err)) {
        return
      }

      if (isNetworkError(err)) {
        enqueue({
          siteId,
          circuitId: circuit.id,
          banMeisho: circuit.banMeisho,
          kairoBangou: circuit.kairoBangou || '',
          kairoMeisho: circuit.kairoMeisho || '',
          phase: 1,
          actionType: 'clear',
          payload: {},
          clientConfirmedAt,
          expectedUpdatedAt: circuit.updatedAt,
        })

        const idx = circuits.value.findIndex(c => c.id === circuit.id)
        const target = circuits.value[idx]

        if (idx !== -1 && target) {
          circuits.value[idx] = {
            ...target,
            p1Kakunin: false,
            p1Mashishime: false,
            p1Worker: null,
            p1ConfirmedAt: null,
          }
        }

        return { success: true, isOffline: true }
      }

      const e = err as Error

      alert(`確定解除に失敗しました: ${e.message}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // インライン編集の保存
  const saveEdit = async (circuit: CircuitItem) => {
    const modifiedFields: string[] = []

    const checkMod = (key: keyof CircuitItem, formKey: string) => {
      const oldVal = (circuit[key] || '') as string
      const newVal = (editForm.value[formKey] || '') as string

      if (oldVal !== newVal) {
        modifiedFields.push(String(key))
      }
    }

    checkMod('kairoBangou', 'kairoBangou')
    checkMod('kairoMeisho', 'kairoMeisho')
    checkMod('cableList', 'cableList')
    checkMod('haisenJousuu', 'haisenJousuu')
    checkMod('setsuchiList', 'setsuchiList')

    if ((circuit.p1Remarks || '') !== (editForm.value.remarks || '')) {
      modifiedFields.push('p1Remarks')
    }

    await confirmPhase1(circuit, {
      ...editForm.value,
      modifiedFields,
    })
  }

  // Phase 2 確定実行
  const confirmPhase2 = async (
    circuit: CircuitItem,
    payload: {
      rVal?: number | null
      sVal?: number | null
      tVal?: number | null
      rStatus?: string | null
      sStatus?: string | null
      tStatus?: string | null
      remarks?: string
      isComplete?: boolean
    },
  ) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    isActionLoading.value[circuit.id] = true

    const clientConfirmedAt = getAccurateNow().toISOString()
    const workerName = currentUser.value
      ? `${currentUser.value.lastName} ${currentUser.value.firstName}`.trim() || currentUser.value.loginId
      : '現場作業員'

    try {
      const res = await $fetch<{ success: boolean, circuit: CircuitItem }>(
        `/api/sites/${siteId}/circuits/${circuit.id}/phase2`,
        {
          method: 'POST',
          body: {
            ...payload,
            clientConfirmedAt,
            expectedUpdatedAt: circuit.updatedAt,
          },
        },
      )

      if (res.circuit) {
        const idx = circuits.value.findIndex(c => c.id === circuit.id)

        if (idx !== -1) {
          circuits.value[idx] = {
            ...circuits.value[idx],
            ...res.circuit,
          }
        }
      }

      return res
    }
    catch (err: unknown) {
      if (handleConflictError(circuit.id, err)) {
        return
      }

      if (isNetworkError(err)) {
        enqueue({
          siteId,
          circuitId: circuit.id,
          banMeisho: circuit.banMeisho,
          kairoBangou: circuit.kairoBangou || '',
          kairoMeisho: circuit.kairoMeisho || '',
          phase: 2,
          actionType: 'confirm',
          payload,
          clientConfirmedAt,
          expectedUpdatedAt: circuit.updatedAt,
          workerName,
        })

        const idx = circuits.value.findIndex(c => c.id === circuit.id)
        const target = circuits.value[idx]

        if (idx !== -1 && target) {
          circuits.value[idx] = {
            ...target,
            zetsuenR: payload.rVal !== undefined ? payload.rVal : target.zetsuenR,
            zetsuenS: payload.sVal !== undefined ? payload.sVal : target.zetsuenS,
            zetsuenT: payload.tVal !== undefined ? payload.tVal : target.zetsuenT,
            p2RStatus: payload.rStatus !== undefined ? payload.rStatus : target.p2RStatus,
            p2SStatus: payload.sStatus !== undefined ? payload.sStatus : target.p2SStatus,
            p2TStatus: payload.tStatus !== undefined ? payload.tStatus : target.p2TStatus,
            p2Remarks: payload.remarks !== undefined ? payload.remarks : target.p2Remarks,
            p2Worker: workerName,
            p2IsComplete: payload.isComplete !== undefined ? payload.isComplete : true,
            p2ConfirmedAt: clientConfirmedAt,
          }
        }

        return { success: true, isOffline: true }
      }

      const e = err as Error

      alert(`フェーズ2の確定に失敗しました: ${e.message}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // Phase 2 確定解除
  const clearPhase2 = async (circuit: CircuitItem) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    if (!confirm(`盤「${circuit.banMeisho}」回路「${circuit.kairoBangou || circuit.kairoMeisho}」のフェーズ2確定を解除しますか？`)) {
      return
    }

    isActionLoading.value[circuit.id] = true

    const clientConfirmedAt = getAccurateNow().toISOString()

    try {
      const res = await $fetch<{ success: boolean, circuit: CircuitItem }>(
        `/api/sites/${siteId}/circuits/${circuit.id}/phase2/clear`,
        {
          method: 'POST',
          body: {
            expectedUpdatedAt: circuit.updatedAt,
            clientConfirmedAt,
          },
        },
      )

      if (res.circuit) {
        const idx = circuits.value.findIndex(c => c.id === circuit.id)

        if (idx !== -1) {
          circuits.value[idx] = {
            ...circuits.value[idx],
            ...res.circuit,
          }
        }
      }

      return res
    }
    catch (err: unknown) {
      if (handleConflictError(circuit.id, err)) {
        return
      }

      if (isNetworkError(err)) {
        enqueue({
          siteId,
          circuitId: circuit.id,
          banMeisho: circuit.banMeisho,
          kairoBangou: circuit.kairoBangou || '',
          kairoMeisho: circuit.kairoMeisho || '',
          phase: 2,
          actionType: 'clear',
          payload: {},
          clientConfirmedAt,
          expectedUpdatedAt: circuit.updatedAt,
        })

        const idx = circuits.value.findIndex(c => c.id === circuit.id)
        const target = circuits.value[idx]

        if (idx !== -1 && target) {
          circuits.value[idx] = {
            ...target,
            zetsuenR: null,
            zetsuenS: null,
            zetsuenT: null,
            p2RStatus: null,
            p2SStatus: null,
            p2TStatus: null,
            p2Worker: null,
            p2ConfirmedAt: null,
            p2IsComplete: false,
          }
        }

        return { success: true, isOffline: true }
      }

      const e = err as Error

      alert(`フェーズ2の解除に失敗しました: ${e.message}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // Phase 2 一括OK確定（現在絞り込み中の未完了・非除外・非ロック回路）
  const batchConfirmPhase2 = async (defaultMegValue: number = 100) => {
    const targets = filteredCircuits.value.filter(
      c => !c.isExcluded && !isCircuitLocked(c) && (!c.p2ConfirmedAt || !c.p2IsComplete),
    )

    if (targets.length === 0) {
      alert('一括確定の対象となる未完了回路がありません')

      return
    }

    if (!confirm(`表示中の未完了回路（${targets.length}件）を一括で ${defaultMegValue}MΩ (OK) として確定しますか？`)) {
      return
    }

    isBatchLoading.value = true

    try {
      for (const circuit of targets) {
        await confirmPhase2(circuit, {
          rVal: defaultMegValue,
          sVal: defaultMegValue,
          tVal: defaultMegValue,
          rStatus: 'OK',
          sStatus: 'OK',
          tStatus: 'OK',
          isComplete: true,
        })
      }
    }
    finally {
      isBatchLoading.value = false
    }
  }

  // Phase 3 確定実行
  const confirmPhase3 = async (
    circuit: CircuitItem,
    payload: {
      rs?: number | null
      st?: number | null
      rt?: number | null
      kensou?: string | null
      remarks?: string
    },
  ) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    isActionLoading.value[circuit.id] = true

    const clientConfirmedAt = getAccurateNow().toISOString()
    const workerName = currentUser.value
      ? `${currentUser.value.lastName} ${currentUser.value.firstName}`.trim() || currentUser.value.loginId
      : '現場作業員'

    try {
      const res = await $fetch<{ success: boolean, circuit: CircuitItem }>(
        `/api/sites/${siteId}/circuits/${circuit.id}/phase3`,
        {
          method: 'POST',
          body: {
            ...payload,
            clientConfirmedAt,
            expectedUpdatedAt: circuit.updatedAt,
          },
        },
      )

      if (res.circuit) {
        const idx = circuits.value.findIndex(c => c.id === circuit.id)

        if (idx !== -1) {
          circuits.value[idx] = {
            ...circuits.value[idx],
            ...res.circuit,
          }
        }
      }

      return res
    }
    catch (err: unknown) {
      if (handleConflictError(circuit.id, err)) {
        return
      }

      if (isNetworkError(err)) {
        enqueue({
          siteId,
          circuitId: circuit.id,
          banMeisho: circuit.banMeisho,
          kairoBangou: circuit.kairoBangou || '',
          kairoMeisho: circuit.kairoMeisho || '',
          phase: 3,
          actionType: 'confirm',
          payload,
          clientConfirmedAt,
          expectedUpdatedAt: circuit.updatedAt,
          workerName,
        })

        const idx = circuits.value.findIndex(c => c.id === circuit.id)
        const target = circuits.value[idx]

        if (idx !== -1 && target) {
          circuits.value[idx] = {
            ...target,
            denatsuRs: payload.rs !== undefined ? payload.rs : target.denatsuRs,
            denatsuSt: payload.st !== undefined ? payload.st : target.denatsuSt,
            denatsuRt: payload.rt !== undefined ? payload.rt : target.denatsuRt,
            kensou: payload.kensou !== undefined ? payload.kensou : target.kensou,
            p3Remarks: payload.remarks !== undefined ? payload.remarks : target.p3Remarks,
            p3Worker: workerName,
            p3ConfirmedAt: clientConfirmedAt,
          }
        }

        return { success: true, isOffline: true }
      }

      const e = err as Error

      alert(`フェーズ3の確定に失敗しました: ${e.message}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // Phase 3 確定解除
  const clearPhase3 = async (circuit: CircuitItem) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    if (!confirm(`盤「${circuit.banMeisho}」回路「${circuit.kairoBangou || circuit.kairoMeisho}」のフェーズ3確定を解除しますか？`)) {
      return
    }

    isActionLoading.value[circuit.id] = true

    const clientConfirmedAt = getAccurateNow().toISOString()

    try {
      const res = await $fetch<{ success: boolean, circuit: CircuitItem }>(
        `/api/sites/${siteId}/circuits/${circuit.id}/phase3/clear`,
        {
          method: 'POST',
          body: {
            expectedUpdatedAt: circuit.updatedAt,
            clientConfirmedAt,
          },
        },
      )

      if (res.circuit) {
        const idx = circuits.value.findIndex(c => c.id === circuit.id)

        if (idx !== -1) {
          circuits.value[idx] = {
            ...circuits.value[idx],
            ...res.circuit,
          }
        }
      }

      return res
    }
    catch (err: unknown) {
      if (handleConflictError(circuit.id, err)) {
        return
      }

      if (isNetworkError(err)) {
        enqueue({
          siteId,
          circuitId: circuit.id,
          banMeisho: circuit.banMeisho,
          kairoBangou: circuit.kairoBangou || '',
          kairoMeisho: circuit.kairoMeisho || '',
          phase: 3,
          actionType: 'clear',
          payload: {},
          clientConfirmedAt,
          expectedUpdatedAt: circuit.updatedAt,
        })

        const idx = circuits.value.findIndex(c => c.id === circuit.id)
        const target = circuits.value[idx]

        if (idx !== -1 && target) {
          circuits.value[idx] = {
            ...target,
            denatsuRs: null,
            denatsuSt: null,
            denatsuRt: null,
            kensou: null,
            p3Worker: null,
            p3ConfirmedAt: null,
          }
        }

        return { success: true, isOffline: true }
      }

      const e = err as Error

      alert(`フェーズ3の解除に失敗しました: ${e.message}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // Phase 3 一括確定（現在絞り込み中の未完了・非除外・非ロック回路）
  const batchConfirmPhase3 = async () => {
    const targets = filteredCircuits.value.filter(
      c => !c.isExcluded && !isCircuitLocked(c) && !c.p3ConfirmedAt,
    )

    if (targets.length === 0) {
      alert('一括確定の対象となる未完了回路がありません')

      return
    }

    if (!confirm(`表示中の未完了回路（${targets.length}件）を一括で標準電圧・正常検相として確定しますか？`)) {
      return
    }

    isBatchLoading.value = true

    try {
      for (const circuit of targets) {
        const three = isThreePhase(circuit)

        if (three) {
          await confirmPhase3(circuit, {
            rs: 210,
            st: 210,
            rt: 210,
            kensou: '正相',
          })
        }
        else {
          await confirmPhase3(circuit, {
            rs: 105,
            st: 105,
            rt: 210,
            kensou: '点灯確認(良)',
          })
        }
      }
    }
    finally {
      isBatchLoading.value = false
    }
  }

  return {
    circuits,
    filteredCircuits,
    panelOptions,
    panelsWithIncompleteKansen,
    availableShubetsuList,
    availableBanMeishoList,
    selectedKeiTo,
    selectedBanShubetsu,
    selectedBanMeisho,
    phaseStats,
    phase2ThresholdMegOhm,
    isCircuitLocked,
    editingRowId,
    editForm,
    isLoading,
    isActionLoading,
    isBatchLoading,
    error,
    isThreePhase,
    evalMegStatus,
    fetchCircuits,
    startEdit,
    cancelEdit,
    saveEdit,
    confirmPhase1,
    clearPhase1,
    confirmPhase2,
    clearPhase2,
    batchConfirmPhase2,
    confirmPhase3,
    clearPhase3,
    batchConfirmPhase3,
  }
}
