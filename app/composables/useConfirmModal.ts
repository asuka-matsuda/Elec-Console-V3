import { computed, ref, watch } from 'vue'

export interface ConfirmOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  intent?: 'primary' | 'secondary' | 'danger' | 'success'
  onConfirm?: () => void | Promise<void>
}

// グローバルな確認モーダルの状態
const isOpen = ref(false)
const isPending = ref(false)
const currentOptions = ref<ConfirmOptions>({
  title: '確認',
  message: 'この操作を実行しますか？',
  confirmText: '確定する',
  cancelText: 'キャンセル',
  intent: 'primary',
})
let resolvePromise: ((value: boolean) => void) | null = null

watch(isOpen, (newVal) => {
  if (!newVal && resolvePromise) {
    resolvePromise(false)
    resolvePromise = null
  }
})

/**
 * 確認モーダル（AppModal）の開閉と状態管理を共通化するComposable
 */
export const useConfirmModal = (
  defaultOptions: Partial<ConfirmOptions> = {},
) => {
  const askConfirm = (customOptions: ConfirmOptions = {}): Promise<boolean> => {
    currentOptions.value = {
      title: customOptions.title || defaultOptions.title || '確認',
      message:
        customOptions.message
        || defaultOptions.message
        || 'この操作を実行しますか？',
      confirmText:
        customOptions.confirmText || defaultOptions.confirmText || '確定する',
      cancelText:
        customOptions.cancelText || defaultOptions.cancelText || 'キャンセル',
      intent: customOptions.intent || defaultOptions.intent || 'primary',
      onConfirm: customOptions.onConfirm || defaultOptions.onConfirm,
    }
    isOpen.value = true

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  const handleConfirm = async () => {
    try {
      isPending.value = true
      if (currentOptions.value.onConfirm) {
        await currentOptions.value.onConfirm()
      }
      if (resolvePromise) {
        resolvePromise(true)
        resolvePromise = null
      }
      isOpen.value = false
    }
    finally {
      isPending.value = false
    }
  }

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
    isOpen.value = false
  }

  const closeConfirm = () => {
    handleCancel()
  }

  return {
    isOpen,
    isPending: computed(() => isPending.value),
    title: computed(() => currentOptions.value.title || '確認'),
    message: computed(() => currentOptions.value.message || 'この操作を実行しますか？'),
    confirmText: computed(() => currentOptions.value.confirmText || '確定する'),
    cancelText: computed(() => currentOptions.value.cancelText || 'キャンセル'),
    intent: computed(() => currentOptions.value.intent || 'primary'),
    askConfirm,
    handleConfirm,
    handleCancel,
    closeConfirm,
  }
}
