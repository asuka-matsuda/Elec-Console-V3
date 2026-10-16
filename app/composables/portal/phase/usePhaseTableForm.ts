/**
 * フェーズ試験テーブル行状態管理 Composable
 *
 * @description フェーズ1〜3の回路一覧テーブルにおける行フォームのキャッシュ・初期化、
 * ローカル一時解除状態の管理、確定判定、および行入力の無効化判定を提供します。
 */
import type { MaybeRefOrGetter } from 'vue'
import { reactive, ref, toValue, watch } from 'vue'

import type { CircuitItem } from '#shared/types/circuit'

interface UsePhaseTableFormOptions<TForm> {
  circuits: MaybeRefOrGetter<CircuitItem[]>
  initForm: (circuit: CircuitItem) => TForm
  isConfirmedServer: (circuit: CircuitItem) => boolean
  isCircuitLocked?: (circuit: CircuitItem) => boolean
  isActionLoading?: MaybeRefOrGetter<Record<string, boolean> | undefined>
}

export function usePhaseTableForm<TForm extends object>(
  options: UsePhaseTableFormOptions<TForm>,
) {
  const rowForms = reactive<Record<string, TForm>>({})
  const unconfirmedRowIds = ref<Set<string>>(new Set())
  const serverFormSnapshots = new Map<string, string>()

  // 回路データ変更時にローカル状態を最新データと同期（ローカル解除中や未確定の入力途中行は上書き保護）
  watch(
    () => toValue(options.circuits),
    (newCircuits) => {
      if (!newCircuits) return
      for (const c of newCircuits) {
        const freshForm = options.initForm(c)
        const freshJson = JSON.stringify(freshForm)
        const currentForm = rowForms[c.id]
        const lastServerJson = serverFormSnapshots.get(c.id)
        const isDirty = currentForm !== undefined
          && lastServerJson !== undefined
          && JSON.stringify(currentForm) !== lastServerJson

        if (!unconfirmedRowIds.value.has(c.id) && !isDirty) {
          rowForms[c.id] = freshForm
          serverFormSnapshots.set(c.id, freshJson)
        }
      }
    },
    { immediate: true },
  )

  const getRowForm = (circuit: CircuitItem): TForm => {
    if (!rowForms[circuit.id]) {
      const freshForm = options.initForm(circuit)

      rowForms[circuit.id] = freshForm
      serverFormSnapshots.set(circuit.id, JSON.stringify(freshForm))
    }

    return rowForms[circuit.id]!
  }

  // 解除ボタンクリック時：サーバー送信は行わず、UI上で解除状態にして確定ボタンに戻す（入力値は保持）
  const handleClearLocally = (circuit: CircuitItem) => {
    unconfirmedRowIds.value.add(circuit.id)
  }

  // 確定ボタン押下時：ローカル解除マークを取り消し、現在のフォーム状態を基準スナップショットに反映
  const markConfirmedLocally = (circuit: CircuitItem) => {
    unconfirmedRowIds.value.delete(circuit.id)
    if (rowForms[circuit.id]) {
      serverFormSnapshots.set(circuit.id, JSON.stringify(rowForms[circuit.id]))
    }
  }

  // 確定済み表示判定（ローカル解除されておらず、サーバー側で確定日時が存在すること）
  const isConfirmed = (circuit: CircuitItem): boolean => {
    if (unconfirmedRowIds.value.has(circuit.id)) return false

    return Boolean(options.isConfirmedServer(circuit))
  }

  // 行の入力無効判定（確定済み、幹線ロック中、除外回路、またはアクション実行中）
  const isRowDisabled = (circuit: CircuitItem): boolean => {
    if (isConfirmed(circuit)) return true
    if (circuit.isExcluded) return true
    if (options.isCircuitLocked?.(circuit)) return true

    const loadingMap = toValue(options.isActionLoading)

    if (loadingMap && loadingMap[circuit.id]) return true

    return false
  }

  return {
    getRowForm,
    handleClearLocally,
    markConfirmedLocally,
    isConfirmed,
    isRowDisabled,
  }
}
