import { ref, computed, watch } from 'vue';
const uuidv4 = () => crypto.randomUUID();
import { calculateConduitSize } from '~/utils/calc/conduit/conduitCalcLogic';
import type { CableInput, ConduitCalcResult } from '~/utils/calc/conduit/conduitCalcLogic';
import { cableData } from '~/utils/data/cableData';
import { conduitData } from '~/utils/data/conduitData';
import { useCalcHistory } from './useCalcHistory';
import { mapConduitToHistory } from '~/utils/calc/conduit/historyMapper';

export function useConduitCalculator() {
  const conduitCategory = ref<string>('');
  
  // ケーブルリスト
  const inputCables = ref<CableInput[]>([
    { id: uuidv4(), category: '', size: '', cores: '', count: 1 }
  ]);

  const { saveHistory: addHistory } = useCalcHistory('elec_calc_conduit_hist');

  // 計算結果
  const result = computed<ConduitCalcResult>(() => {
    return calculateConduitSize(
      conduitCategory.value,
      inputCables.value,
      conduitData,
      cableData
    );
  });

  // 操作
  function addCable() {
    inputCables.value.push({
      id: uuidv4(),
      category: '',
      size: '',
      cores: '',
      count: 1
    });
  }

  function removeCable(id: string) {
    if (inputCables.value.length <= 1) return;
    inputCables.value = inputCables.value.filter(c => c.id !== id);
  }

  function reset() {
    conduitCategory.value = '';
    inputCables.value = [
      { id: uuidv4(), category: '', size: '', cores: '', count: 1 }
    ];
  }

  function saveHistory() {
    if (!result.value.success || result.value.partial) return;
    const historyData = mapConduitToHistory(
      conduitCategory.value,
      inputCables.value,
      result.value
    );
    if (historyData) {
      addHistory(historyData);
    }
  }

  // カテゴリやケーブルが変更され、かつ計算結果が有効なときに自動保存するかどうか
  // （配管サイズ選定はボタン押下ではなくリアルタイム算出なので、適宜Debounce等で保存するのがよい）
  // とりあえず今回は手動保存または一定条件での保存。ここでは手動保存用の関数を提供。
  
  return {
    conduitCategory,
    inputCables,
    result,
    addCable,
    removeCable,
    reset,
    saveHistory
  };
}
