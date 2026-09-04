import { describe, expect, it, vi } from 'vitest'

import { useConfirmModal, useModal } from '../../app/composables/useModal'

describe('useModal', () => {
  it('should initialize with default options', () => {
    const { isOpen, title, message, intent } = useConfirmModal()

    expect(isOpen.value).toBe(false)
    expect(title.value).toBe('確認')
    expect(message.value).toBe('この操作を実行しますか？')
    expect(intent.value).toBe('primary')
  })

  it('should open modal with custom options when askConfirm is called', () => {
    const { isOpen, title, message, intent, askConfirm } = useConfirmModal()

    askConfirm({
      title: '削除確認',
      message: '本当に削除しますか？',
      intent: 'danger',
    })

    expect(isOpen.value).toBe(true)
    expect(title.value).toBe('削除確認')
    expect(message.value).toBe('本当に削除しますか？')
    expect(intent.value).toBe('danger')
  })

  it('should execute onConfirm callback and close modal on handleConfirm', async () => {
    const onConfirmMock = vi.fn()
    const { isOpen, askConfirm, handleConfirm } = useConfirmModal()

    askConfirm({
      title: 'テスト',
      onConfirm: onConfirmMock,
    })

    expect(isOpen.value).toBe(true)
    await handleConfirm()
    expect(onConfirmMock).toHaveBeenCalledTimes(1)
    expect(isOpen.value).toBe(false)
  })

  it('should resolve promise to true when handleConfirm is called', async () => {
    const { askConfirm, handleConfirm } = useConfirmModal()
    const promise = askConfirm({ title: 'Promiseテスト' })

    await handleConfirm()
    const result = await promise

    expect(result).toBe(true)
  })

  it('should resolve promise to false when handleCancel is called', async () => {
    const { askConfirm, handleCancel } = useConfirmModal()
    const promise = askConfirm({ title: 'キャンセルテスト' })

    handleCancel()
    const result = await promise

    expect(result).toBe(false)
  })

  it('should export useConfirmModal as an alias of useModal', () => {
    expect(useConfirmModal).toBe(useModal)
  })
})
