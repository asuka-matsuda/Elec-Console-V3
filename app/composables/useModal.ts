/**
 * モーダル（Modal）状態管理 Composable
 *
 * @description ダイアログの開閉状態、タイトル、メッセージ、確定/キャンセルコールバックを管理します。
 */

import { computed, watch } from 'vue'

import { useState } from '#app'
import { STATE_KEYS } from '~/constants/storageKeys'
import type { ButtonVariant } from '~/types/components'

export interface ConfirmOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  intent?: ButtonVariant
  onConfirm?: () => void | Promise<void>
}

// クライアント専用の Promise リゾルバー
let resolvePromise: ((value: boolean) => void) | null = null

/**
 * モーダル（Modal）の開閉と状態管理を共通化するComposable（SSR安全）
 */
export const useModal = (
  defaultOptions: Partial<ConfirmOptions> = {},
) => {
  const isOpen = useState<boolean>(STATE_KEYS.GLOBAL_MODAL_OPEN, () => false)
  const isPending = useState<boolean>(STATE_KEYS.GLOBAL_MODAL_PENDING, () => false)
  const currentOptions = useState<ConfirmOptions>(
    STATE_KEYS.GLOBAL_MODAL_OPTIONS,
    () => ({
      title: '確認',
      message: 'この操作を実行しますか？',
      confirmText: '確定する',
      cancelText: 'キャンセル',
      intent: 'success',
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
      intent: customOptions.intent || defaultOptions.intent || 'success',
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
    intent: computed(() => currentOptions.value.intent || 'success'),
    askConfirm,
    handleConfirm,
    handleCancel,
    closeConfirm,
  }
}
