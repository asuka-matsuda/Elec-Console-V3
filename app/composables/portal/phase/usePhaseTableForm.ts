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

  // 回路データ変更時にローカル状態を最新データと同期
  watch(
    () => toValue(options.circuits),
    (newCircuits) => {
      unconfirmedRowIds.value.clear()
      if (!newCircuits) return
      for (const c of newCircuits) {
        rowForms[c.id] = options.initForm(c)
      }
    },
    { immediate: true },
  )

  const getRowForm = (circuit: CircuitItem): TForm => {
    if (!rowForms[circuit.id]) {
      rowForms[circuit.id] = options.initForm(circuit)
    }

    return rowForms[circuit.id]!
  }

  // 解除ボタンクリック時：サーバー送信は行わず、UI上で解除状態にして確定ボタンに戻す（入力値は保持）
  const handleClearLocally = (circuit: CircuitItem) => {
    unconfirmedRowIds.value.add(circuit.id)
  }

  // 確定ボタン押下時：ローカル解除マークを取り消す
  const markConfirmedLocally = (circuit: CircuitItem) => {
    unconfirmedRowIds.value.delete(circuit.id)
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
    rowForms,
    unconfirmedRowIds,
    getRowForm,
    handleClearLocally,
    markConfirmedLocally,
    isConfirmed,
    isRowDisabled,
  }
}
