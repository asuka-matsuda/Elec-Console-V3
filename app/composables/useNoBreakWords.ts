/**
 * 改行禁止ワード管理 Composable
 *
 * @description 現場設定（またはシステム設定）で指定された単語の途中で改行されないよう Word Joiner 結合を適用します。
 */

import type { MaybeRef } from 'vue'
import { computed, toValue } from 'vue'

import { useRoute, useState } from '#app'
import { useApi } from '~/composables/useApi'
import { applyNoBreakToText } from '~/utils/noBreak'

export function useNoBreakWords(explicitSiteId?: MaybeRef<string | null | undefined>) {
  let route: ReturnType<typeof useRoute> | null = null

  try {
    route = useRoute()
  }
  catch {
    // Non-Nuxt test environment fallback
  }

  // 現場IDを優先度順に解決 (明示的指定 -> route param)
  const currentSiteId = computed(() => {
    const fromRef = toValue(explicitSiteId)

    if (fromRef) return fromRef
    if (route?.params?.siteId && typeof route.params.siteId === 'string') {
      return route.params.siteId
    }

    return null
  })

  // 現場別キャッシュマップ: { [siteId: string]: string[] }
  const siteWordsMap = useState<Record<string, string[]>>('site_no_break_words_map', () => ({}))
  const isLoadedMap = useState<Record<string, boolean>>('site_no_break_words_loaded_map', () => ({}))
  const isLoading = useState<boolean>('no_break_words_loading', () => false)

  const words = computed<string[]>({
    get: () => {
      const sId = currentSiteId.value

      if (sId && siteWordsMap.value[sId]) {
        return siteWordsMap.value[sId]
      }

      return siteWordsMap.value['__default__'] || []
    },
    set: (newWords: string[]) => {
      const key = currentSiteId.value || '__default__'

      siteWordsMap.value = {
        ...siteWordsMap.value,
        [key]: newWords,
      }
    },
  })

  const isLoaded = computed(() => {
    const key = currentSiteId.value || '__default__'

    return !!isLoadedMap.value[key]
  })

  const getApiSafe = () => {
    try {
      return useApi().$api
    }
    catch {
      return null
    }
  }

  /**
   * 改行禁止ワードを取得（現場IDがある場合は現場別、ない場合はシステム設定）
   */
  const fetchWords = async (force = false, targetSiteId?: string) => {
    const sId = targetSiteId || currentSiteId.value
    const key = sId || '__default__'

    if ((isLoadedMap.value[key] && !force) || isLoading.value) return

    const $api = getApiSafe()

    if (!$api) return

    isLoading.value = true
    try {
      if (sId) {
        // 現場別エンドポイントから取得
        const res = await $api<{ success: boolean, words: string[] }>(`/api/sites/${sId}/no-break-words`)

        if (res && res.success && Array.isArray(res.words)) {
          siteWordsMap.value = {
            ...siteWordsMap.value,
            [sId]: res.words,
          }
          isLoadedMap.value = {
            ...isLoadedMap.value,
            [key]: true,
          }
        }
      }
      else {
        // システム設定フォールバック
        const res = await $api<{ success: boolean, words: string[] }>('/api/system-settings/no-break-words')

        if (res && res.success && Array.isArray(res.words)) {
          siteWordsMap.value = {
            ...siteWordsMap.value,
            ['__default__']: res.words,
          }
          isLoadedMap.value = {
            ...isLoadedMap.value,
            [key]: true,
          }
        }
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
   * 改行禁止ワードを保存
   */
  const saveWords = async (newWords: string[], targetSiteId?: string): Promise<{ success: boolean, message?: string }> => {
    const $api = getApiSafe()

    if (!$api) return { success: false, message: 'APIクライアントが初期化されていません。' }

    const sId = targetSiteId || currentSiteId.value
    const key = sId || '__default__'

    try {
      if (sId) {
        const res = await $api<{ success: boolean, words: string[] }>(`/api/sites/${sId}/no-break-words`, {
          method: 'PUT',
          body: { words: newWords },
        })

        if (res && res.success && Array.isArray(res.words)) {
          siteWordsMap.value = {
            ...siteWordsMap.value,
            [sId]: res.words,
          }
          isLoadedMap.value = {
            ...isLoadedMap.value,
            [key]: true,
          }

          return { success: true }
        }
      }
      else {
        const res = await $api<{ success: boolean, words: string[] }>('/api/master/settings/no-break-words', {
          method: 'PUT',
          body: { words: newWords },
        })

        if (res && res.success && Array.isArray(res.words)) {
          siteWordsMap.value = {
            ...siteWordsMap.value,
            ['__default__']: res.words,
          }
          isLoadedMap.value = {
            ...isLoadedMap.value,
            [key]: true,
          }

          return { success: true }
        }
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
    currentSiteId,
    fetchWords,
    saveWords,
    applyNoBreak,
  }
}
