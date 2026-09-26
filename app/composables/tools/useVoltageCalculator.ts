/**
 * 電圧降下・許容電流計算 Composable
 *
 * @description 配電方式・線種・長距離配線における電圧降下率・許容電流・適合ブレーカー容量の計算および数式生成を管理します。
 */

import { computed, watch } from 'vue'

import { useToolPage } from '~/composables/tools/useToolPage'
import type { VoltageCalcResult } from '~/types/voltage'
import {
  getAvailableCores,
  getAvailableSizes,
  getDefaultCoreForPhase,
} from '~/utils/cable'
import { mapVoltageToHistory } from '~/utils/tools/voltage/historyMapper'
import { calculateLogic } from '~/utils/tools/voltage/voltageCalcLogic'
import { getVoltageFormFields } from '~/utils/tools/voltage/voltageFormConfig'
import { generateMathData } from '~/utils/tools/voltage/voltageFormulaGenerator'
import type { VoltageFormState } from '~/utils/tools/voltage/voltageMapper'
import { mapFormToVoltageCalcInputs } from '~/utils/tools/voltage/voltageMapper'

export const defaultForm: VoltageFormState = {
  mode: 'drop',
  phase: '',
  loadValue: null,
  loadUnit: 'A',
  powerFactor: '',
  distance: null,
  category: '',
  cores: '',
  cableIdx: '',
  parallel: '1',
  derating: '1.0',
  ambientTemp: 'none',
  targetDrop: '',
}

export function useVoltageCalculator() {
  const {
    inputs: form,
    result: calcResult,
    saveToHistory,
    openResetModal,
    resetInputs,
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

  const isSizeCalcMode = computed(() => form.value.mode === 'size')
  const isDropCalcMode = computed(() => form.value.mode === 'drop')

  const computedAvailableSizes = computed(() => {
    return getAvailableSizes(form.value.category)
  })

  const computedAvailableCores = computed(() => {
    return getAvailableCores(form.value.category)
  })

  watch(
    () => form.value.category,
    (newVal, oldVal) => {
      // hydration時にoldValが空の場合はスキップ
      if (!oldVal) return

      const sizes = getAvailableSizes(newVal)

      if (!sizes.some(s => s.value === form.value.cableIdx)) {
        form.value.cableIdx = ''
      }
    },
  )

  // ケーブル種別または配電方式の変更に応じて心数を自動設定
  watch(
    [() => form.value.phase, () => form.value.category],
    ([newPhase, newType], [oldPhase, oldType]) => {
      const cores = getAvailableCores(newType)

      if (cores.length === 0) {
        form.value.cores = ''

        return
      }

      const defaultCore = getDefaultCoreForPhase(newPhase, cores)
      const isCurrentCoreValid = cores.some(c => c.value === form.value.cores)
      const isPhaseChanged = Boolean(oldPhase && newPhase !== oldPhase)
      const isTypeChanged = Boolean(oldType && newType !== oldType)

      if (!form.value.cores || !isCurrentCoreValid || isPhaseChanged || isTypeChanged) {
        form.value.cores = defaultCore
      }
    },
    { immediate: true },
  )

  const isSinglePhase = computed(() => {
    return form.value.phase ? form.value.phase.startsWith('1P') : false
  })

  // 配電方式の変更を監視し、単相が選択されたら力率を 1.0 に固定
  watch(
    () => form.value.phase,
    (newPhase) => {
      if (newPhase && newPhase.startsWith('1P')) {
        form.value.powerFactor = '1.0'
      }
    },
    { immediate: true },
  )

  const calcInputs = computed(() => mapFormToVoltageCalcInputs(form.value))

  const mathSteps = computed(() => {
    return generateMathData(calcInputs.value, calcResult.value) || []
  })

  const isSaveDisabled = computed(() => !calcInputs.value.isReady)

  const formFields = computed(() =>
    getVoltageFormFields(
      () => isDropCalcMode.value,
      () => isSizeCalcMode.value,
      () => computedAvailableSizes.value,
      () => !!form.value.category,
      () => isSinglePhase.value,
      () => computedAvailableCores.value,
    ),
  )

  return {
    form,
    formFields,
    isSaveDisabled,
    openResetModal,
    resetInputs,
    handleSaveHistory: saveToHistory,
    isSizeCalcMode,
    isDropCalcMode,
    computedAvailableSizes,
    computedAvailableCores,
    calcInputs,
    calcResult,
    mathSteps,
    isSinglePhase,
  }
}
