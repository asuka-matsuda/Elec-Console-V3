import { computed } from 'vue'

import { useCookie, useRouter, useState } from '#app'
import { useApi } from '~/composables/useApi'
import type { User } from '~/types/auth'

export const useAuth = () => {
  const token = useCookie<string | null>('auth_token', {
    default: () => null,
    maxAge: 60 * 60 * 24,
  })
  const currentUser = useState<User | null>('currentUser', () => null)
  const router = useRouter()
  const { $api } = useApi()

  const initAuth = async (force = false) => {
    if (token.value && (!currentUser.value || force)) {
      try {
        const data = await $api<{ success: boolean, user: User }>(
          '/api/auth/me',
        )

        if (data && data.success && data.user) {
          currentUser.value = data.user
        }
        else {
          logout()
        }
      }
      catch {
        console.error('Session restore failed')
      }
    }
  }

  const login = async (loginId: string, pass: string) => {
    try {
      const response = await $api<{
        success: boolean
        token: string
        user: User
        mustChangePassword?: boolean
      }>('/api/auth/login', {
        method: 'POST',
        body: { loginId, password: pass },
      })

      if (response.success) {
        token.value = response.token
        currentUser.value = response.user

        if (response.mustChangePassword) {
          return { success: true, mustChangePassword: true }
        }

        return { success: true }
      }

      return { success: false, message: 'ログインに失敗しました。' }
    }
    catch (err: any) {
      const msg
        = err.data?.statusMessage
          || err.data?.message
          || 'ログインIDまたはパスワードが違います。'

      return { success: false, message: msg }
    }
  }

  const logout = () => {
    token.value = null
    currentUser.value = null
    router.push('/login')
  }

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    initAuth,
  }
}
