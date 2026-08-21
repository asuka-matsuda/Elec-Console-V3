import { ref, watch } from "vue";
import type { HistoryEntry } from "~/utils/calc/history/types";

/**
 * 汎用的な計算履歴管理コンポーザブル
 * @param storageKey ローカルストレージの保存先キー (例: 'elec_calc_voltage_hist')
 */
export function useCalcHistory(storageKey: string) {
  // setup時に即座にlocalStorageから読み込む (クライアントナビゲーション時のラグを防ぐため)
  const getInitialState = (): HistoryEntry[] => {
    if (import.meta.client) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse history:", e);
        }
      }
    }
    return [];
  };

  const historyList = ref<HistoryEntry[]>(getInitialState());

  // クライアント側のみ、値が変更されたらストレージに自動保存
  if (import.meta.client) {
    watch(
      historyList,
      (newVal) => {
        localStorage.setItem(storageKey, JSON.stringify(newVal));
      },
      { deep: true }
    );
  }

  /**
   * 履歴を追加する
   * @param entry 追加する履歴オブジェクト
   */
  const saveHistory = async (entry: Omit<HistoryEntry, "id" | "timestamp">) => {
    // 処理中アニメーションを見せるため、意図的に少し待機する（UX向上）
    await new Promise(resolve => setTimeout(resolve, 600));

    const now = new Date();
    const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp,
    };

    // 先頭に追加（最新が上）
    historyList.value.unshift(newEntry);
  };

  /**
   * 履歴を1件削除する
   * @param id 削除する履歴のID
   */
  const deleteHistory = (id: string) => {
    historyList.value = historyList.value.filter(item => item.id !== id);
  };

  /**
   * 全ての履歴を削除する
   */
  const clearAll = () => {
    historyList.value = [];
  };

  return {
    historyList,
    saveHistory,
    deleteHistory,
    clearAll,
  };
}
