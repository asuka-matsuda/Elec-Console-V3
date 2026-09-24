/**
 * パスワード変更 Composable
 *
 * @description パスワードの入力状態、バリデーション、および変更API呼び出しのフローを管理します。
 */

import { ref } from 'vue'

import { useAuth } from '~/composables/useAuth'

export const usePasswordChange = () => {
  const { changePassword } = useAuth()

  const currentPassword = ref('')
  const newPassword = ref('')
  const confirmPassword = ref('')
  const passwordError = ref('')
  const isSuccess = ref(false)
  const isLoading = ref(false)

  // フォーム入力値および各種状態の初期化
  const resetForm = () => {
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    passwordError.value = ''
    isSuccess.value = false
    isLoading.value = false
  }

  // 新しいパスワードのバリデーションおよび変更API呼び出し
  const handleChangePassword = async (): Promise<boolean> => {
    passwordError.value = ''
    isSuccess.value = false

    // 現在のパスワード検証
    if (!currentPassword.value) {
      passwordError.value = '現在のパスワードを入力してください。'

      return false
    }

    // パスワードポリシー検証（最低8文字以上）
    if (!newPassword.value || newPassword.value.length < 8) {
      passwordError.value = 'パスワードは8文字以上で入力してください。'

      return false
    }

    // 現在のパスワードと新しいパスワードの重複検証
    if (currentPassword.value === newPassword.value) {
      passwordError.value = '現在のパスワードとは異なるパスワードを設定してください。'

      return false
    }

    // 新旧確認用パスワードの一致検証
    if (newPassword.value !== confirmPassword.value) {
      passwordError.value = '確認用パスワードが一致しません。'

      return false
    }

    isLoading.value = true
    try {
      const res = await changePassword(newPassword.value, currentPassword.value)

      if (res.success) {
        isSuccess.value = true
        // 成功時はセキュリティのため入力欄をクリア
        currentPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''

        return true
      }

      passwordError.value = res.message || 'パスワードの変更に失敗しました。'

      return false
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    currentPassword,
    newPassword,
    confirmPassword,
    passwordError,
    isSuccess,
    isLoading,
    handleChangePassword,
    resetForm,
  }
}
