import { computed } from 'vue';
import { calculateRackSize, generateMathData } from '~/utils/calc/rack/rackCalcLogic';
import type { RackCableInput, RackCalcInputs, RackCalcResult } from '~/utils/calc/rack/rackCalcLogic';
import { cableData } from '~/utils/data/cableData';
import { mapRackToHistory } from '~/utils/calc/rack/historyMapper';
import { useToolPage } from '~/composables/calc/useToolPage';

export interface RackCableUIInput {
  id: string;
  category: string;
  cableIdx: string;
  count: number | null;
}

export interface RackInputs {
  isStrong: boolean;
  isWeak: boolean;
  lStrong: number | null;
  lWeak: number | null;
  rackHeight: number | null;
  separatorWidth: number | null;
  strongCablesUI: RackCableUIInput[];
  weakCablesUI: RackCableUIInput[];
}

const defaultInputs: RackInputs = {
  isStrong: true,
  isWeak: false,
  lStrong: null,
  lWeak: null,
  rackHeight: null,
  separatorWidth: null,
  strongCablesUI: [{ id: crypto.randomUUID(), category: '', cableIdx: '', count: null }],
  weakCablesUI: [{ id: crypto.randomUUID(), category: '', cableIdx: '', count: null }]
};

export function useRackCalculator() {
  const standardRackSizes = [100, 200, 300, 400, 500, 600, 800, 1000, 1200];

  function convertUIToRackCable(uiInput: RackCableUIInput): RackCableInput {
    let def: any;
    if (uiInput.cableIdx && uiInput.cableIdx.startsWith('idx_')) {
      const idx = parseInt(uiInput.cableIdx.replace('idx_', ''), 10);
      def = cableData[idx];
    }
    let d = 0;
    if (def) {
      if (def.diameter.includes('×')) {
        d = Math.max(...def.diameter.split('×').map((s: string) => parseFloat(s.trim())));
      } else {
        d = parseFloat(def.diameter);
      }
    }
    return { d, n: uiInput.count };
  }

  const {
    inputs,
    result,
    saveToHistory: handleSaveHistory,
    resetInputs,
    isResetModalOpen,
    openResetModal,
    confirmReset,
  } = useToolPage<RackInputs, RackCalcResult>(
    'rack',
    'ケーブルラック選定',
    defaultInputs,
    (inputs) => {
      const rH = inputs.rackHeight ?? 0;
      const maxDepth = Math.max(1, rH - 10);
      const logicInputs: RackCalcInputs = {
        isStrong: inputs.isStrong,
        isWeak: inputs.isWeak,
        lStrong: inputs.lStrong ?? 1,
        lWeak: inputs.lWeak ?? 1,
        rackHeight: rH,
        maxDepth: maxDepth,
        strongCables: inputs.strongCablesUI.map(convertUIToRackCable),
        weakCables: inputs.weakCablesUI.map(convertUIToRackCable),
        separatorWidth: inputs.separatorWidth ?? 0
      };
      return calculateRackSize(logicInputs, standardRackSizes);
    },
    {
      toHistory: (inputs, res) => {
        const rH = inputs.rackHeight ?? 0;
        const maxDepth = Math.max(1, rH - 10);
        return mapRackToHistory(
          {
            isStrong: inputs.isStrong,
            isWeak: inputs.isWeak,
            lStrong: inputs.lStrong ?? 1,
            lWeak: inputs.lWeak ?? 1,
            rackHeight: rH,
            maxDepth: maxDepth,
            separatorWidth: inputs.separatorWidth ?? 0
          },
          inputs.strongCablesUI,
          inputs.weakCablesUI,
          res!
        )!;
      },
      fromHistory: () => JSON.parse(JSON.stringify(defaultInputs))
    }
  );

  const maxDepth = computed(() => Math.max(1, (inputs.value.rackHeight ?? 0) - 10));

  function addStrongCable() {
    inputs.value.strongCablesUI.push({ id: crypto.randomUUID(), category: '', cableIdx: '', count: 1 });
  }

  function removeStrongCable(id: string) {
    if (inputs.value.strongCablesUI.length <= 1) return;
    inputs.value.strongCablesUI = inputs.value.strongCablesUI.filter((c) => c.id !== id);
  }

  function addWeakCable() {
    inputs.value.weakCablesUI.push({ id: crypto.randomUUID(), category: '', cableIdx: '', count: 1 });
  }

  function removeWeakCable(id: string) {
    if (inputs.value.weakCablesUI.length <= 1) return;
    inputs.value.weakCablesUI = inputs.value.weakCablesUI.filter((c) => c.id !== id);
  }

  const mathSteps = computed(() => {
    const logicInputs: RackCalcInputs = {
      isStrong: inputs.value.isStrong,
      isWeak: inputs.value.isWeak,
      lStrong: inputs.value.lStrong ?? 1,
      lWeak: inputs.value.lWeak ?? 1,
      rackHeight: inputs.value.rackHeight ?? 0,
      maxDepth: maxDepth.value,
      strongCables: inputs.value.strongCablesUI.map(convertUIToRackCable),
      weakCables: inputs.value.weakCablesUI.map(convertUIToRackCable),
      separatorWidth: inputs.value.separatorWidth ?? 0
    };
    return generateMathData(logicInputs, result.value);
  });

  return {
    inputs,
    maxDepth,
    result,
    addStrongCable,
    removeStrongCable,
    addWeakCable,
    removeWeakCable,
    reset: resetInputs,
    isResetModalOpen,
    openResetModal,
    confirmReset,
    handleSaveHistory,
    mathSteps
  };
}
