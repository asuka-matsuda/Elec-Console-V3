import { computed } from 'vue'

import { useToolPage } from '~/composables/tools/useToolPage'
import { cableData } from '~/constants/data/cableData'
import { conduitData } from '~/constants/data/conduitData'
import type {
  CableInput,
  ConduitCalcResult,
} from '~/utils/tools/conduit/conduitCalcLogic'
import {
  calculateConduitSize,
  generateMathData,
} from '~/utils/tools/conduit/conduitCalcLogic'
import { mapConduitToHistory } from '~/utils/tools/conduit/historyMapper'

const uuidv4 = () => crypto.randomUUID()

export interface ConduitInputs {
  conduitCategory: string
  customFillRate: number | null
  inputCables: CableInput[]
}

const defaultInputs: ConduitInputs = {
  conduitCategory: '',
  customFillRate: 80,
  inputCables: [
    {
      id: uuidv4(),
      category: '',
      cableIdx: '',
      count: null as unknown as number,
    },
  ],
}

export function useConduitCalculator() {
  const {
    inputs,
    result,
    saveToHistory: saveHistory,
    resetInputs,
    isResetModalOpen,
    openResetModal,
    confirmReset,
  } = useToolPage<ConduitInputs, ConduitCalcResult>(
    'conduit',
    '配管サイズ自動選定',
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
      fromHistory: () => {
        return JSON.parse(JSON.stringify(defaultInputs))
      },
    },
  )

  if (inputs.value.customFillRate === undefined) {
    inputs.value.customFillRate = 80
  }

  // VueUseのuseLocalStorageで初期化される際にidが重複しないようにする等の対処は必要に応じて行う
  if (!inputs.value.inputCables || inputs.value.inputCables.length === 0) {
    inputs.value.inputCables = [
      { id: uuidv4(), category: '', cableIdx: '', count: null },
    ]
  }

  function addCable() {
    inputs.value.inputCables.push({
      id: uuidv4(),
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
    return generateMathData(
      inputs.value.conduitCategory,
      inputs.value.inputCables,
      result.value,
    )
  })

  return {
    inputs,
    result,
    addCable,
    removeCable,
    reset: resetInputs,
    saveHistory,
    handleSaveHistory: saveHistory,
    isResetModalOpen,
    openResetModal,
    confirmReset,
    mathSteps,
  }
}
