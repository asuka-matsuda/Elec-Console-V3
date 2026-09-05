import type { ComputedRef, Ref } from 'vue'
import { computed, getCurrentInstance, onUnmounted, ref, toValue } from 'vue'

import type { AppButtonVariant } from '~/types/components'

export type AsyncActionState = 'idle' | 'saving' | 'success' | 'error'

export interface UseAsyncActionFeedbackOptions {
  action: () => Promise<void>
  disabled?:
    | Ref<boolean | undefined>
    | ComputedRef<boolean | undefined>
    | boolean
  label?: Ref<string | undefined> | ComputedRef<string | undefined> | string
  defaultVariant?:
    | Ref<AppButtonVariant | undefined>
    | ComputedRef<AppButtonVariant | undefined>
    | AppButtonVariant
  successDuration?: number
  errorDuration?: number
}

export interface ActionFeedbackContent {
  icon: string
  text: string
}

export function useAsyncActionFeedback(options: UseAsyncActionFeedbackOptions) {
  const {
    action,
    disabled = false,
    label = '保存',
    defaultVariant = 'success',
    successDuration = 2000,
    errorDuration = 3000,
  } = options

  const state = ref<AsyncActionState>('idle')
  let resetTimer: ReturnType<typeof setTimeout> | null = null

  const clearTimer = () => {
    if (resetTimer) {
      clearTimeout(resetTimer)
      resetTimer = null
    }
  }

  if (getCurrentInstance()) {
    onUnmounted(() => {
      clearTimer()
    })
  }

  const buttonVariant = computed<AppButtonVariant>(() => {
    if (state.value === 'error') return 'danger'
    if (state.value === 'success') return 'success'

    return toValue(defaultVariant) || 'success'
  })

  const currentContent = computed<ActionFeedbackContent>(() => {
    switch (state.value) {
      case 'saving':
        return { icon: 'loader', text: '保存中...' }
      case 'success':
        return { icon: 'check', text: '保存しました' }
      case 'error':
        return { icon: 'alert-circle', text: '保存に失敗しました' }
      default:
        return { icon: 'save', text: toValue(label) || '履歴に保存' }
    }
  })

  const execute = async () => {
    const isDisabled = toValue(disabled)

    if (isDisabled || state.value !== 'idle') return

    clearTimer()
    state.value = 'saving'
    try {
      await action()
      state.value = 'success'
      resetTimer = setTimeout(() => {
        state.value = 'idle'
        resetTimer = null
      }, successDuration)
    }
    catch (e) {
      console.error('Action failed:', e)
      state.value = 'error'
      resetTimer = setTimeout(() => {
        state.value = 'idle'
        resetTimer = null
      }, errorDuration)
    }
  }

  return {
    state,
    buttonVariant,
    currentContent,
    execute,
  }
}
