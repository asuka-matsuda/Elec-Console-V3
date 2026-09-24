/**
 * グローバル認証ガードミドルウェア
 *
 * 全ルートの遷移時にセッション復元を行い、未認証ユーザーのログイン画面誘導や
 * パスワードリセット要求ユーザーの強制リダイレクトを制御します。
 */

import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, initAuth, currentUser } = useAuth()

  // SSR/CSRに関わらず、アクセス時にセッションを復元する
  await initAuth()

  const publicPages = ['/login']
  const isPublicPage = publicPages.includes(to.path)

  if (!isAuthenticated.value && !isPublicPage) {
    return navigateTo('/login')
  }

  if (isAuthenticated.value && isPublicPage) {
    if (currentUser.value?.requirePasswordReset) {
      return navigateTo('/change-password')
    }

    return navigateTo('/')
  }

  // パスワード変更が必要なユーザーのルーティング制御
  if (isAuthenticated.value && currentUser.value?.requirePasswordReset) {
    if (to.path !== '/change-password') {
      return navigateTo('/change-password')
    }
  }
  else if (
    isAuthenticated.value
    && !currentUser.value?.requirePasswordReset
    && to.path === '/change-password'
  ) {
    // 変更不要なユーザーがアクセスした場合はホームへ
    return navigateTo('/')
  }

  // 現場アクセス認可制御（/portal/:siteId 配下の現場ポータルルートへのアクセス検証）
  if (isAuthenticated.value && to.path.startsWith('/portal/') && to.path !== '/portal/admin') {
    const siteId = (to.params.siteId as string) || to.path.split('/')[2]

    if (siteId && siteId !== 'admin') {
      const isMaster = currentUser.value?.loginId === 'master'
      const assignedIds = currentUser.value?.assignedSiteIds || []

      if (!isMaster && !assignedIds.includes(siteId)) {
        // 未アサインの現場への不正アクセスを遮断し、ポータルトップへ誘導
        return navigateTo('/portal')
      }
    }
  }
})
