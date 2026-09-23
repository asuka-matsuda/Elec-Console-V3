/**
 * マスター管理者権限（Master）ルートミドルウェア
 *
 * 開発責任者（松田飛鳥氏）のマスター管理者権限を検証し、
 * 一般管理者や作業者による特権管理画面（マスター設定等）へのアクセスを保護します。
 */

import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(() => {
  const { isMaster } = useAuth()

  if (!isMaster.value) {
    return navigateTo('/')
  }
})
