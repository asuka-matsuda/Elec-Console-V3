import type { Ref } from 'vue'
import { ref } from 'vue'

import { useState } from '#app'
import { useApi } from '~/composables/useApi'

// 文字間に挿入する Word Joiner（不可視の改行禁止制御文字）
export const WORD_JOINER = '\u2060'
// 改行禁止ハイフン（Non-breaking hyphen）
export const NO_BREAK_HYPHEN = '\u2011'

// テスト環境（NuxtAppコンテキスト外）用フォールバック
const fallbackWords = ref<string[]>([])
const fallbackLoaded = ref(false)
const fallbackLoading = ref(false)

const getSafeState = <T>(key: string, fallbackRef: Ref<T>, init: () => T): Ref<T> => {
  try {
    return useState<T>(key, init)
  }
  catch {
    return fallbackRef
  }
}

/**
 * 文字列の各文字間に Word Joiner (\u2060) を挿入して不可分な1単語として結合する
 */
export function joinWithWordJoiner(word: string): string {
  if (!word || word.length <= 1) return word
  // 既存の \u2060 を一旦除去して二重結合を防止
  const clean = word.replaceAll(WORD_JOINER, '')

  return clean.split('').join(WORD_JOINER)
}

export const useNoBreakWords = () => {
  const words = getSafeState<string[]>('system_no_break_words', fallbackWords, () => [])
  const isLoaded = getSafeState<boolean>('system_no_break_words_loaded', fallbackLoaded, () => false)
  const isLoading = getSafeState<boolean>('system_no_break_words_loading', fallbackLoading, () => false)

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
   * 1. 〇-〇（英数字・ハイフン結合記号: 1-1, 1L-1, A-2 など）の改行禁止化
   * 2. 〇〇盤（漢字・カタカナ・英数字＋盤: 分電盤, 電灯盤, 動力盤 など）の自動改行禁止化
   * 3. システム管理で登録された改行禁止ワードの改行禁止化
   */
  const applyNoBreak = (val: unknown): unknown => {
    if (typeof val !== 'string' || !val) return val

    let result = val

    // 1. 〇-〇 パターン（1-1, 1L-1, A-2 など）
    // 英数字とハイフンの組み合わせを改行禁止ハイフン(\u2011)および Word Joiner で結合
    result = result.replace(/([a-zA-Z0-9]+)-([a-zA-Z0-9]+)/g, (_, p1, p2) => {
      return joinWithWordJoiner(`${p1}${NO_BREAK_HYPHEN}${p2}`)
    })

    // 2. 〇〇盤 パターン（例: 分電盤, 電灯盤, 動力盤, 配電盤, 制御盤, 受電盤, 高圧盤, コンセント盤 など）
    // 「〜盤」そのものを不可分結合し、直前の設備名（例: 2階マテハン、融雪）との自然な境界で折り返せるようにする
    result = result.replace(/(分電盤|電灯盤|動力盤|配電盤|制御盤|受電盤|高圧盤|開閉盤|変電盤|コンセント盤|継電器盤|整流器盤|端子盤|通信盤|火報盤|保安盤|ゲート盤|[一-龠]{2,3}盤|[ァ-ヴー]{2,4}盤)/g, (match) => {
      return joinWithWordJoiner(match)
    })

    // 3. 手動登録ワード（文字数降順でマッチング）
    if (words.value.length > 0) {
      const sortedWords = [...words.value].sort((a, b) => b.length - a.length)

      for (const word of sortedWords) {
        if (!word || word.length < 2) continue
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(escaped, 'g')

        result = result.replace(regex, match => joinWithWordJoiner(match))
      }
    }

    return result
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
