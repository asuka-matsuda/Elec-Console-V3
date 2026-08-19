import { ref, computed } from 'vue';
import { calculateRackSize } from '~/utils/calc/rack/rackCalcLogic';
import type { RackCableInput, RackCalcInputs, RackCalcResult } from '~/utils/calc/rack/rackCalcLogic';
import { cableData } from '~/utils/data/cableData';
import { useCalcHistory } from './useCalcHistory';
import { mapRackToHistory } from '~/utils/calc/rack/historyMapper';

export interface RackCableUIInput {
  id: string;
  category: string;
  size: string;
  cores: string;
  count: number;
}

export function useRackCalculator() {
  const isStrong = ref(true);
  const isWeak = ref(false);
  const lStrong = ref(1);
  const lWeak = ref(1);
  const rackHeight = ref(70);
  const separatorWidth = ref(30);

  const strongCablesUI = ref<RackCableUIInput[]>([
    { id: crypto.randomUUID(), category: '', size: '', cores: '', count: 1 }
  ]);
  const weakCablesUI = ref<RackCableUIInput[]>([
    { id: crypto.randomUUID(), category: '', size: '', cores: '', count: 1 }
  ]);

  const { saveHistory } = useCalcHistory("elec_calc_rack_hist");

  // maxDepth calculation
  const maxDepth = computed(() => Math.max(1, rackHeight.value - 10));

  // standard rack sizes (usually 100, 200, 300, 400, 500, 600, 800, 1000, 1200)
  const standardRackSizes = [100, 200, 300, 400, 500, 600, 800, 1000, 1200];

  function convertUIToRackCable(uiInput: RackCableUIInput): RackCableInput {
    const def = cableData.find(
      (c) => c.category === uiInput.category && c.size === uiInput.size && c.cores === uiInput.cores
    );
    let d = 0;
    if (def) {
      if (def.diameter.includes('×')) {
        d = Math.max(...def.diameter.split('×').map((s) => parseFloat(s.trim())));
      } else {
        d = parseFloat(def.diameter);
      }
    }
    return { d, n: uiInput.count };
  }

  const result = computed<RackCalcResult>(() => {
    const inputs: RackCalcInputs = {
      isStrong: isStrong.value,
      isWeak: isWeak.value,
      lStrong: lStrong.value,
      lWeak: lWeak.value,
      rackHeight: rackHeight.value,
      maxDepth: maxDepth.value,
      strongCables: strongCablesUI.value.map(convertUIToRackCable),
      weakCables: weakCablesUI.value.map(convertUIToRackCable),
      separatorWidth: separatorWidth.value
    };
    return calculateRackSize(inputs, standardRackSizes);
  });

  function addStrongCable() {
    strongCablesUI.value.push({ id: crypto.randomUUID(), category: '', size: '', cores: '', count: 1 });
  }

  function removeStrongCable(id: string) {
    if (strongCablesUI.value.length <= 1) return;
    strongCablesUI.value = strongCablesUI.value.filter((c) => c.id !== id);
  }

  function addWeakCable() {
    weakCablesUI.value.push({ id: crypto.randomUUID(), category: '', size: '', cores: '', count: 1 });
  }

  function removeWeakCable(id: string) {
    if (weakCablesUI.value.length <= 1) return;
    weakCablesUI.value = weakCablesUI.value.filter((c) => c.id !== id);
  }

  function reset() {
    isStrong.value = true;
    isWeak.value = false;
    lStrong.value = 1;
    lWeak.value = 1;
    rackHeight.value = 70;
    separatorWidth.value = 30;
    strongCablesUI.value = [{ id: crypto.randomUUID(), category: '', size: '', cores: '', count: 1 }];
    weakCablesUI.value = [{ id: crypto.randomUUID(), category: '', size: '', cores: '', count: 1 }];
  }

  function handleSaveHistory() {
    if (result.value.error || result.value.totalWidth === 0) return;
    const historyData = mapRackToHistory(
      {
        isStrong: isStrong.value,
        isWeak: isWeak.value,
        lStrong: lStrong.value,
        lWeak: lWeak.value,
        rackHeight: rackHeight.value,
        maxDepth: maxDepth.value,
        separatorWidth: separatorWidth.value
      },
      strongCablesUI.value,
      weakCablesUI.value,
      result.value
    );
    if (historyData) {
      saveHistory(historyData);
    }
  }

  return {
    isStrong,
    isWeak,
    lStrong,
    lWeak,
    rackHeight,
    separatorWidth,
    strongCablesUI,
    weakCablesUI,
    result,
    addStrongCable,
    removeStrongCable,
    addWeakCable,
    removeWeakCable,
    reset,
    handleSaveHistory
  };
}
