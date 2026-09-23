/**
 * 認証初期化 Nuxt プラグイン
 *
 * アプリケーション起動時にセッション状態の復元処理（initAuth）をキックします。
 */

import { defineNuxtPlugin } from '#app'
import { useAuth } from '~/composables/useAuth'

export default defineNuxtPlugin(async () => {
  const { initAuth } = useAuth()

  initAuth()
})
