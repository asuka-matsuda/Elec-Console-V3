import type { Ref } from 'vue'
import { computed, ref, watch } from 'vue'

import { useState } from '#app'

export interface ConfirmOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  intent?: 'primary' | 'secondary' | 'danger' | 'success'
  onConfirm?: () => void | Promise<void>
}

// クライアント専用の Promise リゾルバー
let resolvePromise: ((value: boolean) => void) | null = null

// テスト環境（Nuxtコンテキスト外）用フォールバック
const fallbackOpen = ref(false)
const fallbackPending = ref(false)
const fallbackOptions = ref<ConfirmOptions>({
  title: '確認',
  message: 'この操作を実行しますか？',
  confirmText: '確定する',
  cancelText: 'キャンセル',
  intent: 'primary',
})

const getSafeState = <T>(key: string, fallbackRef: Ref<T>, init: () => T): Ref<T> => {
  try {
    return useState<T>(key, init)
  }
  catch {
    return fallbackRef
  }
}

/**
 * モーダル（AppModal）の開閉と状態管理を共通化するComposable（SSR安全）
 */
export const useModal = (
  defaultOptions: Partial<ConfirmOptions> = {},
) => {
  const isOpen = getSafeState<boolean>('global-modal-is-open', fallbackOpen, () => false)
  const isPending = getSafeState<boolean>('global-modal-is-pending', fallbackPending, () => false)
  const currentOptions = getSafeState<ConfirmOptions>(
    'global-modal-options',
    fallbackOptions,
    () => ({
      title: '確認',
      message: 'この操作を実行しますか？',
      confirmText: '確定する',
      cancelText: 'キャンセル',
      intent: 'primary',
    }),
  )

  watch(isOpen, (newVal) => {
    if (!newVal && resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
  })

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

// 後方互換用エイリアス
export const useConfirmModal = useModal
