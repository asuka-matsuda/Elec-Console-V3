import type { Ref } from 'vue'
import { ref } from 'vue'

/**
 * 簡易フォーム必須バリデーション Composable
 *
 * 各画面での重複したバリデーションループやエラー初期化処理を共通化し、
 * 宣言的なルール定義のみでフォーム検証を行えるようにします。
 *
 * @param form 検証対象のフォーム Ref オブジェクト
 * @param requiredRules 必須項目のプロパティ名と日本語表示ラベルのマップ
 */
export function useFormValidation<T extends Record<string, unknown>>(
  form: Ref<T>,
  requiredRules: Partial<Record<keyof T, string>>,
) {
  type Key = keyof T

  const fieldErrors = ref<Partial<Record<Key, string>>>({})

  /**
   * 必須項目の入力チェックを一括実行し、エラーマップを更新する
   * @returns すべての検証を通過した場合は true、エラーがある場合は false
   */
  const validate = (): boolean => {
    const errors: Partial<Record<Key, string>> = {}

    for (const [key, label] of Object.entries(requiredRules) as [Key, string][]) {
      const val = form.value[key]

      if (val === undefined || val === null) {
        errors[key] = `${label}は必須です。`
      }
      else if (typeof val === 'string' && !val.trim()) {
        errors[key] = `${label}は必須です。`
      }
    }

    fieldErrors.value = errors

    return Object.keys(errors).length === 0
  }

  /**
   * エラー状態をすべて初期化する
   */
  const resetErrors = () => {
    fieldErrors.value = {}
  }

  /**
   * 特定のフィールドに個別エラーメッセージ（サーバーAPIエラー等）を設定する
   */
  const setFieldError = (key: Key, message: string) => {
    fieldErrors.value[key] = message
  }

  return {
    fieldErrors,
    validate,
    resetErrors,
    setFieldError,
  }
}
