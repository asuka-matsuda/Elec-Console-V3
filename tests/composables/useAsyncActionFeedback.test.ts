import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useAsyncActionFeedback } from '../../app/composables/useAsyncActionFeedback'

describe('useAsyncActionFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with idle state and default content', () => {
    const action = vi.fn()
    const { state, buttonVariant, currentContent } = useAsyncActionFeedback({
      action,
      label: '保存テスト',
      defaultVariant: 'primary',
    })

    expect(state.value).toBe('idle')
    expect(buttonVariant.value).toBe('primary')
    expect(currentContent.value).toEqual({ icon: 'save', text: '保存テスト' })
  })

  it('should transition to saving then success, and reset to idle after duration', async () => {
    let resolveAction!: () => void
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve
        }),
    )

    const { state, currentContent, buttonVariant, execute }
      = useAsyncActionFeedback({
        action,
        successDuration: 2000,
      })

    const executePromise = execute()

    expect(state.value).toBe('saving')
    expect(currentContent.value.text).toBe('保存中...')

    resolveAction()
    await executePromise

    expect(state.value).toBe('success')
    expect(buttonVariant.value).toBe('success')
    expect(currentContent.value.text).toBe('保存しました')

    // 2000ms 経過で idle にリセット
    vi.advanceTimersByTime(2000)
    expect(state.value).toBe('idle')
  })

  it('should transition to error on failure and reset to idle', async () => {
    const action = vi.fn().mockRejectedValue(new Error('Network error'))
    const { state, currentContent, buttonVariant, execute }
      = useAsyncActionFeedback({
        action,
        errorDuration: 3000,
      })

    await execute()

    expect(state.value).toBe('error')
    expect(buttonVariant.value).toBe('danger')
    expect(currentContent.value.text).toBe('保存に失敗しました')

    // 3000ms 経過で idle にリセット
    vi.advanceTimersByTime(3000)
    expect(state.value).toBe('idle')
  })

  it('should not execute when disabled or already saving', async () => {
    const action = vi.fn()
    const disabled = ref(true)

    const { execute } = useAsyncActionFeedback({
      action,
      disabled,
    })

    await execute()
    expect(action).not.toHaveBeenCalled()
  })
})
