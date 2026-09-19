import { useState } from '#app'
import { useApi } from '~/composables/useApi'
import { applyNoBreakToText } from '~/utils/noBreak'

export const useNoBreakWords = () => {
  const words = useState<string[]>('system_no_break_words', () => [])
  const isLoaded = useState<boolean>('system_no_break_words_loaded', () => false)
  const isLoading = useState<boolean>('system_no_break_words_loading', () => false)

  const getApiSafe = () => {
    try {
      return useApi().$api
    }
    catch {
      return null
    }
  }

  /**
   * システム設定から改行禁止ワードを取得
   */
  const fetchWords = async (force = false) => {
    if ((isLoaded.value && !force) || isLoading.value) return

    const $api = getApiSafe()

    if (!$api) return

    isLoading.value = true
    try {
      const res = await $api<{ success: boolean, words: string[] }>('/api/system-settings/no-break-words')

      if (res && res.success && Array.isArray(res.words)) {
        words.value = res.words
        isLoaded.value = true
      }
    }
    catch (error) {
      console.error('Failed to fetch no-break words:', error)
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * マスターユーザーとして改行禁止ワードを保存
   */
  const saveWords = async (newWords: string[]): Promise<{ success: boolean, message?: string }> => {
    const $api = getApiSafe()

    if (!$api) return { success: false, message: 'APIクライアントが初期化されていません。' }

    try {
      const res = await $api<{ success: boolean, words: string[] }>('/api/master/settings/no-break-words', {
        method: 'PUT',
        body: { words: newWords },
      })

      if (res && res.success && Array.isArray(res.words)) {
        words.value = res.words
        isLoaded.value = true

        return { success: true }
      }

      return { success: false, message: '保存に失敗しました。' }
    }
    catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }

      return {
        success: false,
        message: fetchErr?.data?.message || '設定の保存に失敗しました。',
      }
    }
  }

  /**
   * テキストに対して改行禁止処理を適用する
   */
  const applyNoBreak = (val: unknown): unknown => {
    return applyNoBreakToText(val, words.value)
  }

  return {
    words,
    isLoaded,
    isLoading,
    fetchWords,
    saveWords,
    applyNoBreak,
  }
}
