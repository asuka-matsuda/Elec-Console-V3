import { beforeEach, describe, expect, it } from 'vitest'

import { useToast } from '../../app/composables/useToast'

describe('useToast', () => {
  beforeEach(() => {
    const { clear } = useToast()

    clear()
  })

  it('adds and removes a toast correctly', () => {
    const { toasts, success, remove } = useToast()

    expect(toasts.value).toHaveLength(0)

    const id = success('保存が完了しました')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('保存が完了しました')
    expect(toasts.value[0].type).toBe('success')

    if (id) {
      remove(id)
    }

    expect(toasts.value).toHaveLength(0)
  })

  it('handles error, danger, warning, and info helper methods', () => {
    const { toasts, error, danger, warning, info } = useToast()

    error('エラーが発生しました')
    danger('危険なエラーです')
    warning('注意してください')
    info('更新情報があります')

    expect(toasts.value).toHaveLength(4)
    expect(toasts.value[0].type).toBe('danger')
    expect(toasts.value[1].type).toBe('danger')
    expect(toasts.value[2].type).toBe('warning')
    expect(toasts.value[3].type).toBe('info')
  })

  it('limits maximum toasts to 5 items', () => {
    const { toasts, add } = useToast()

    for (let i = 1; i <= 7; i++) {
      add({ message: `通知 ${i}` })
    }

    expect(toasts.value).toHaveLength(5)
    expect(toasts.value[0].message).toBe('通知 3')
    expect(toasts.value[4].message).toBe('通知 7')
  })

  it('supports default method and action/preserve options', () => {
    const { toasts, default: defaultToast, success } = useToast()
    const onAction = () => {}

    defaultToast('デフォルトメッセージ')
    success('アクション付き', {
      preserve: true,
      action: {
        label: '元に戻す',
        onClick: onAction,
      },
    })

    expect(toasts.value).toHaveLength(2)
    expect(toasts.value[0].type).toBe('default')
    expect(toasts.value[1].preserve).toBe(true)
    expect(toasts.value[1].action?.label).toBe('元に戻す')
  })
})
