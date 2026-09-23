/**
 * パスワード変更 Composable
 *
 * @description パスワードの入力状態、バリデーション、および変更API呼び出しのフローを管理します。
 */

import { ref } from 'vue'

import { useAuth } from '~/composables/useAuth'

export const usePasswordChange = () => {
  const { changePassword } = useAuth()

  const newPassword = ref('')
  const confirmPassword = ref('')
  const passwordError = ref('')
  const isSuccess = ref(false)
  const isLoading = ref(false)

  // フォーム入力値および各種状態の初期化
  const resetForm = () => {
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

    // パスワードポリシー検証（最低8文字以上）
    if (!newPassword.value || newPassword.value.length < 8) {
      passwordError.value = 'パスワードは8文字以上で入力してください。'

      return false
    }

    // 新旧確認用パスワードの一致検証
    if (newPassword.value !== confirmPassword.value) {
      passwordError.value = '確認用パスワードが一致しません。'

      return false
    }

    isLoading.value = true
    try {
      const res = await changePassword(newPassword.value)

      if (res.success) {
        isSuccess.value = true
        // 成功時はセキュリティのため入力欄をクリア
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
    newPassword,
    confirmPassword,
    passwordError,
    isSuccess,
    isLoading,
    handleChangePassword,
    resetForm,
  }
}
