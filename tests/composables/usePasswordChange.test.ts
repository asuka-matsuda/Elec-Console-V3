import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePasswordChange } from '~/composables/usePasswordChange'

// useAuth のモック
const mockChangePassword = vi.fn()

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    changePassword: mockChangePassword,
  }),
}))

describe('usePasswordChange', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('初期状態が正しく設定されていること', () => {
    const { currentPassword, newPassword, confirmPassword, passwordError, isSuccess, isLoading } = usePasswordChange()

    expect(currentPassword.value).toBe('')
    expect(newPassword.value).toBe('')
    expect(confirmPassword.value).toBe('')
    expect(passwordError.value).toBe('')
    expect(isSuccess.value).toBe(false)
    expect(isLoading.value).toBe(false)
  })

  it('現在のパスワードが未入力の場合はバリデーションエラーになりAPIは呼ばれないこと', async () => {
    const { currentPassword, newPassword, confirmPassword, passwordError, handleChangePassword } = usePasswordChange()

    currentPassword.value = ''
    newPassword.value = 'validPassword123'
    confirmPassword.value = 'validPassword123'

    const success = await handleChangePassword()

    expect(success).toBe(false)
    expect(passwordError.value).toBe('現在のパスワードを入力してください。')
    expect(mockChangePassword).not.toHaveBeenCalled()
  })

  it('8文字未満のパスワードの場合はバリデーションエラーになりAPIは呼ばれないこと', async () => {
    const { currentPassword, newPassword, confirmPassword, passwordError, handleChangePassword } = usePasswordChange()

    currentPassword.value = 'oldPassword123'
    newPassword.value = 'short'
    confirmPassword.value = 'short'

    const success = await handleChangePassword()

    expect(success).toBe(false)
    expect(passwordError.value).toBe('パスワードは8文字以上で入力してください。')
    expect(mockChangePassword).not.toHaveBeenCalled()
  })

  it('現在のパスワードと同じパスワードの場合はバリデーションエラーになりAPIは呼ばれないこと', async () => {
    const { currentPassword, newPassword, confirmPassword, passwordError, handleChangePassword } = usePasswordChange()

    currentPassword.value = 'samePassword123'
    newPassword.value = 'samePassword123'
    confirmPassword.value = 'samePassword123'

    const success = await handleChangePassword()

    expect(success).toBe(false)
    expect(passwordError.value).toBe('現在のパスワードとは異なるパスワードを設定してください。')
    expect(mockChangePassword).not.toHaveBeenCalled()
  })

  it('確認用パスワードと一致しない場合はバリデーションエラーになりAPIは呼ばれないこと', async () => {
    const { currentPassword, newPassword, confirmPassword, passwordError, handleChangePassword } = usePasswordChange()

    currentPassword.value = 'oldPassword123'
    newPassword.value = 'validPassword123'
    confirmPassword.value = 'differentPassword456'

    const success = await handleChangePassword()

    expect(success).toBe(false)
    expect(passwordError.value).toBe('確認用パスワードが一致しません。')
    expect(mockChangePassword).not.toHaveBeenCalled()
  })

  it('API成功時に isSuccess が true になり、入力フィールドがリセットされること', async () => {
    mockChangePassword.mockResolvedValueOnce({ success: true })

    const {
      currentPassword,
      newPassword,
      confirmPassword,
      passwordError,
      isSuccess,
      isLoading,
      handleChangePassword,
    } = usePasswordChange()

    currentPassword.value = 'oldValidPassword777'
    newPassword.value = 'newValidPassword888'
    confirmPassword.value = 'newValidPassword888'

    const promise = handleChangePassword()

    expect(isLoading.value).toBe(true)

    const success = await promise

    expect(success).toBe(true)
    expect(isLoading.value).toBe(false)
    expect(isSuccess.value).toBe(true)
    expect(passwordError.value).toBe('')
    expect(currentPassword.value).toBe('')
    expect(newPassword.value).toBe('')
    expect(confirmPassword.value).toBe('')
    expect(mockChangePassword).toHaveBeenCalledWith('newValidPassword888', 'oldValidPassword777')
  })

  it('API失敗時に passwordError にエラーメッセージが設定されること', async () => {
    mockChangePassword.mockResolvedValueOnce({
      success: false,
      message: '現在のパスワードが間違っています。',
    })

    const {
      currentPassword,
      newPassword,
      confirmPassword,
      passwordError,
      isSuccess,
      isLoading,
      handleChangePassword,
    } = usePasswordChange()

    currentPassword.value = 'wrongPassword123'
    newPassword.value = 'newValidPassword888'
    confirmPassword.value = 'newValidPassword888'

    const success = await handleChangePassword()

    expect(success).toBe(false)
    expect(isLoading.value).toBe(false)
    expect(isSuccess.value).toBe(false)
    expect(passwordError.value).toBe('現在のパスワードが間違っています。')
  })

  it('resetForm でステートが初期化されること', () => {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
      passwordError,
      isSuccess,
      resetForm,
    } = usePasswordChange()

    currentPassword.value = 'oldPassword'
    newPassword.value = 'somePassword'
    confirmPassword.value = 'somePassword'
    passwordError.value = 'Some error'
    isSuccess.value = true

    resetForm()

    expect(currentPassword.value).toBe('')
    expect(newPassword.value).toBe('')
    expect(confirmPassword.value).toBe('')
    expect(passwordError.value).toBe('')
    expect(isSuccess.value).toBe(false)
  })
})
