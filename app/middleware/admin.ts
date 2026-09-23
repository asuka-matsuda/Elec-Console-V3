/**
 * 管理者権限（Admin）ルートミドルウェア
 *
 * ログイン中ユーザーが管理者（Admin）以上の権限を持っているか検証し、
 * 一般作業者のアクセスをポータルトップへリダイレクト保護します。
 */

import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(() => {
  const { isAdmin } = useAuth()

  if (!isAdmin.value) {
    return navigateTo('/portal')
  }
})
