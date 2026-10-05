/**
 * Toast 通知状態管理 Composable
 *
 * @description アプリケーション全体で共有される一時的なトースト通知の追加・削除を管理します。
 * window.alert() の代替として、ユーザーの操作を妨げずに処理結果を伝達します。
 */
import { useState } from '#app'
import { STATE_KEYS } from '~/constants/storageKeys'
import type { ToastItem, ToastType } from '~/types/components'

let toastCounter = 0

export function useToast() {
  const toasts = useState<ToastItem[]>(STATE_KEYS.TOAST_LIST, () => [])

  const remove = (id: string) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const clear = () => {
    toasts.value = []
  }

  const add = (params: { message: string, type?: ToastType, duration?: number }) => {
    const {
      message,
      type = 'info',
      duration = 3500,
    } = params

    if (!message) return

    toastCounter += 1
    const id = `toast-${Date.now()}-${toastCounter}`

    const item: ToastItem = {
      id,
      message,
      type,
      duration,
    }

    // 最新の通知が下（または上）に追加、最大5件に制限
    toasts.value = [...toasts.value.slice(-4), item]

    if (import.meta.client && duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  const success = (message: string, duration?: number) => {
    return add({ message, type: 'success', duration })
  }

  const error = (message: string, duration?: number) => {
    return add({ message, type: 'danger', duration: duration ?? 5000 })
  }

  const info = (message: string, duration?: number) => {
    return add({ message, type: 'info', duration })
  }

  const warning = (message: string, duration?: number) => {
    return add({ message, type: 'warning', duration: duration ?? 4500 })
  }

  return {
    toasts,
    add,
    remove,
    clear,
    success,
    error,
    danger: error,
    info,
    warning,
  }
}
