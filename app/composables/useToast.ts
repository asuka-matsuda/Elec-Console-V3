/**
 * Toast 通知状態管理 Composable
 *
 * @description アプリケーション全体で共有される一時的なトースト通知の追加・削除を管理します。
 * window.alert() の代替として、ユーザーの操作を妨げずに処理結果を伝達します。
 */
import { useState } from '#app'
import { STATE_KEYS } from '~/constants/storageKeys'
import type { ToastItem, ToastOptions } from '~/types/components'

let toastCounter = 0

type ToastOptionsOrDuration = number | Omit<ToastOptions, 'type'>

function normalizeOptions(optionsOrDuration?: ToastOptionsOrDuration): Omit<ToastOptions, 'type'> {
  if (typeof optionsOrDuration === 'number') {
    return { duration: optionsOrDuration }
  }

  return optionsOrDuration || {}
}

export function useToast() {
  const toasts = useState<ToastItem[]>(STATE_KEYS.TOAST_LIST, () => [])

  const remove = (id: string) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const clear = () => {
    toasts.value = []
  }

  const add = (params: { message: string } & ToastOptions) => {
    const {
      message,
      type = 'info',
      preserve = false,
      action,
      cancel,
    } = params

    if (!message) return ''

    let defaultDuration = 3500

    if (type === 'danger') defaultDuration = 5000
    else if (type === 'warning') defaultDuration = 4500

    const duration = params.duration ?? defaultDuration

    toastCounter += 1
    const id = `toast-${Date.now()}-${toastCounter}`

    const item: ToastItem = {
      id,
      message,
      type,
      duration,
      preserve,
      action,
      cancel,
    }

    // 最新の通知が下に追加、最大5件に制限
    toasts.value = [...toasts.value.slice(-4), item]

    // preserve が true の場合は手動クローズまで自動消滅しない
    if (import.meta.client && !preserve && duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  const success = (message: string, options?: ToastOptionsOrDuration) => {
    return add({ message, type: 'success', ...normalizeOptions(options) })
  }

  const error = (message: string, options?: ToastOptionsOrDuration) => {
    return add({ message, type: 'danger', ...normalizeOptions(options) })
  }

  const info = (message: string, options?: ToastOptionsOrDuration) => {
    return add({ message, type: 'info', ...normalizeOptions(options) })
  }

  const warning = (message: string, options?: ToastOptionsOrDuration) => {
    return add({ message, type: 'warning', ...normalizeOptions(options) })
  }

  const defaultToast = (message: string, options?: ToastOptionsOrDuration) => {
    return add({ message, type: 'default', ...normalizeOptions(options) })
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
    default: defaultToast,
  }
}
