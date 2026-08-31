import { ref, computed } from "vue";

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  intent?: "primary" | "secondary" | "danger" | "success";
  onConfirm?: () => void | Promise<void>;
}

/**
 * 確認モーダル（AppConfirmModal）の開閉と状態管理を共通化するComposable
 */
export const useConfirmModal = (defaultOptions: Partial<ConfirmOptions> = {}) => {
  const isOpen = ref(false);
  const options = ref<ConfirmOptions>({
    title: defaultOptions.title || "確認",
    message: defaultOptions.message || "この操作を実行しますか？",
    confirmText: defaultOptions.confirmText || "確定する",
    cancelText: defaultOptions.cancelText || "キャンセル",
    intent: defaultOptions.intent || "primary",
    onConfirm: defaultOptions.onConfirm,
  });

  const isPending = ref(false);

  /**
   * 確認モーダルを開く
   * @param customOptions 今回の呼び出し固有のオプション
   */
  const askConfirm = (customOptions: ConfirmOptions) => {
    options.value = {
      title: customOptions.title || defaultOptions.title || "確認",
      message: customOptions.message || defaultOptions.message || "この操作を実行しますか？",
      confirmText: customOptions.confirmText || defaultOptions.confirmText || "確定する",
      cancelText: customOptions.cancelText || defaultOptions.cancelText || "キャンセル",
      intent: customOptions.intent || defaultOptions.intent || "primary",
      onConfirm: customOptions.onConfirm,
    };
    isOpen.value = true;
  };

  /**
   * モーダルで「確定」ボタンが押された時のハンドラ
   */
  const handleConfirm = async () => {
    if (!options.value.onConfirm) {
      isOpen.value = false;
      return;
    }

    try {
      isPending.value = true;
      await options.value.onConfirm();
      isOpen.value = false;
    } finally {
      isPending.value = false;
    }
  };

  const closeConfirm = () => {
    isOpen.value = false;
  };

  return {
    isOpen,
    isPending: computed(() => isPending.value),
    title: computed(() => options.value.title),
    message: computed(() => options.value.message),
    confirmText: computed(() => options.value.confirmText),
    cancelText: computed(() => options.value.cancelText),
    intent: computed(() => options.value.intent),
    askConfirm,
    handleConfirm,
    closeConfirm,
  };
};
