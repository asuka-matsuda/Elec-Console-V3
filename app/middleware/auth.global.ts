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
  else if (isAuthenticated.value && !currentUser.value?.requirePasswordReset && to.path === '/change-password') {
    // 変更不要なユーザーがアクセスした場合はホームへ
    return navigateTo('/')
  }
})
