/**
 * 電線管サイズ選定計算 Composable
 *
 * @description 入線ケーブル情報から管内断面積・占有率を算出し、内線規程に適合する最小電線管サイズを自動選定します。
 */

import { computed } from 'vue'

import { useToolPage } from '~/composables/tools/useToolPage'
import { cableData } from '~/constants/data/cableData'
import { conduitData } from '~/constants/data/conduitData'
import { generateUuid } from '~/utils/crypto'
import type {
  ConduitCalcResult,
  ConduitInputs,
} from '~/utils/tools/conduit/conduitCalcLogic'
import {
  calculateConduitSize,
  generateConduitMathData,
} from '~/utils/tools/conduit/conduitCalcLogic'
import { mapConduitToHistory } from '~/utils/tools/conduit/historyMapper'

const defaultInputs: ConduitInputs = {
  conduitCategory: '',
  customFillRate: 80,
  inputCables: [
    {
      id: generateUuid(),
      category: '',
      cableIdx: '',
      count: 1,
    },
  ],
}

export function useConduitCalculator() {
  const {
    inputs,
    result,
    isShowingBasis,
    isSaving,
    handleSave,
    openResetModal,
  } = useToolPage<ConduitInputs, ConduitCalcResult>(
    'conduit',
    defaultInputs,
    inputs =>
      calculateConduitSize(
        inputs.conduitCategory,
        inputs.inputCables,
        conduitData,
        cableData,
        inputs.customFillRate,
      ),
    {
      toHistory: (inputs, res) =>
        mapConduitToHistory(
          inputs.conduitCategory,
          inputs.inputCables,
          res!,
          inputs.customFillRate,
        )!,
    },
  )

  if (inputs.value.customFillRate === undefined) {
    inputs.value.customFillRate = 80
  }

  // useSessionStorageで初期化される際にidが重複しないようにする等の対処は必要に応じて行う
  if (!inputs.value.inputCables || inputs.value.inputCables.length === 0) {
    inputs.value.inputCables = [
      { id: generateUuid(), category: '', cableIdx: '', count: 1 },
    ]
  }

  function addCable() {
    inputs.value.inputCables.push({
      id: generateUuid(),
      category: '',
      cableIdx: '',
      count: 1,
    })
  }

  function removeCable(id: string) {
    if (inputs.value.inputCables.length <= 1) return
    inputs.value.inputCables = inputs.value.inputCables.filter(
      c => c.id !== id,
    )
  }

  const mathSteps = computed(() => {
    return generateConduitMathData(
      inputs.value.conduitCategory,
      inputs.value.inputCables,
      result.value,
    )
  })

  const isSaveDisabled = computed(() => !result.value?.success || Boolean(result.value?.partial))

  return {
    inputs,
    result,
    isSaveDisabled,
    isShowingBasis,
    isSaving,
    handleSave,
    addCable,
    removeCable,
    openResetModal,
    mathSteps,
  }
}
