import { computed, watch } from 'vue'

import { useToolPage } from '~/composables/tools/useToolPage'
import type { VoltageCalcResult } from '~/types/voltage'
import { getAvailableSizes } from '~/utils/cable'
import {
  calculateLogic,
  generateMathData,
} from '~/utils/tools/voltage/calcVoltageEngine'
import { mapVoltageToHistory } from '~/utils/tools/voltage/historyMapper'
import type { VoltageFormState } from '~/utils/tools/voltage/voltageMapper'
import { mapFormToVoltageCalcInputs } from '~/utils/tools/voltage/voltageMapper'

export const defaultForm: VoltageFormState = {
  mode: 'drop',
  phase: '',
  loadValue: null,
  loadUnit: 'A',
  powerFactor: '',
  distance: null,
  cableType: '',
  cores: '',
  fixedSize: '',
  parallel: '',
  derating: '',
  ambientTemp: '',
  targetDrop: '',
}

export function useVoltageCalculator() {
  const {
    inputs: form,
    result: calcResult,
    saveToHistory,
    isResetModalOpen,
    openResetModal,
    confirmReset,
  } = useToolPage<VoltageFormState, VoltageCalcResult | null>(
    'voltage',
    '電圧降下・ケーブルサイズ選定',
    { ...defaultForm },
    (formInputs) => {
      const calcInputs = mapFormToVoltageCalcInputs(formInputs)

      if (!calcInputs.isReady) return null

      return calculateLogic(calcInputs)
    },
    {
      toHistory: (formInputs, res) => {
        const inputs = mapFormToVoltageCalcInputs(formInputs)

        if (!inputs.isReady || !res) return null

        return mapVoltageToHistory('電圧降下・ケーブルサイズ選定', inputs, res)
      },
      fromHistory: () => JSON.parse(JSON.stringify(defaultForm)),
    },
  )

  const resetForm = confirmReset

  const isSizeCalcMode = computed(() => form.value.mode === 'size')
  const isDropCalcMode = computed(() => form.value.mode === 'drop')

  const computedAvailableSizes = computed(() => {
    return getAvailableSizes(form.value.cableType)
  })

  watch(
    () => form.value.cableType,
    (newVal, oldVal) => {
      // hydration時にoldValが空の場合はスキップ
      if (!oldVal) return

      const sizes = getAvailableSizes(newVal)

      if (!sizes.some(s => s.value === form.value.fixedSize)) {
        form.value.fixedSize = ''
      }
    },
  )

  const calcInputs = computed(() => mapFormToVoltageCalcInputs(form.value))

  const mathSteps = computed(() => {
    return generateMathData(calcInputs.value, calcResult.value) || []
  })

  return {
    form,
    isResetModalOpen,
    openResetModal,
    resetForm,
    handleSaveHistory: saveToHistory,
    isSizeCalcMode,
    isDropCalcMode,
    computedAvailableSizes,
    calcInputs,
    calcResult,
    mathSteps,
  }
}
