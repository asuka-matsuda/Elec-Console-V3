import { computed } from 'vue'

import { useCookie, useRouter, useState } from '#app'
import { useApi } from '~/composables/useApi'
import { STATE_KEYS, STORAGE_KEYS } from '~/constants/storageKeys'
import type { User } from '~/types/auth'

export const useAuth = () => {
  const token = useCookie<string | null>('auth_token', {
    default: () => null,
    maxAge: 60 * 60 * 24,
  })
  const currentUser = useState<User | null>(STATE_KEYS.CURRENT_USER, () => null)
  const router = useRouter()
  const { $api } = useApi()

  // サーバー時刻とのオフセット（差分ms）を更新・保存
  const setServerTimeOffset = (serverTimeIso?: string) => {
    if (!import.meta.client || !serverTimeIso) return

    try {
      const serverMs = new Date(serverTimeIso).getTime()
      const clientMs = Date.now()
      const offsetMs = serverMs - clientMs

      localStorage.setItem(STORAGE_KEYS.SERVER_TIME_OFFSET, String(offsetMs))
    }
    catch {
      // タイムパース失敗時はスキップ
    }
  }

  // 補正された正確な現在時刻を取得（圏外時も端末RTC + オフセットで算出）
  const getAccurateNow = (): Date => {
    if (!import.meta.client) return new Date()

    try {
      const offsetStr = localStorage.getItem(STORAGE_KEYS.SERVER_TIME_OFFSET)
      const offsetMs = offsetStr ? parseInt(offsetStr, 10) : 0

      return new Date(Date.now() + (isNaN(offsetMs) ? 0 : offsetMs))
    }
    catch {
      return new Date()
    }
  }

  const initAuth = async (force = false) => {
    if (token.value && (!currentUser.value || force)) {
      try {
        const data = await $api<{ success: boolean, user: User, serverTime?: string }>(
          '/api/auth/me',
        )

        if (data && data.success && data.user) {
          currentUser.value = data.user
          setServerTimeOffset(data.serverTime)

          if (import.meta.client) {
            localStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(data.user))
          }
        }
        else {
          logout()
        }
      }
      catch {
        // オフライン（圏外）またはネットワークエラー時はキャッシュから復元してセッションを維持
        if (import.meta.client) {
          const cachedUserStr = localStorage.getItem(STORAGE_KEYS.CACHED_USER)

          if (cachedUserStr) {
            try {
              const cachedUser = JSON.parse(cachedUserStr) as User

              currentUser.value = cachedUser
              console.warn('[Offline Mode] Restored session from local cache')

              return
            }
            catch {
              // パース失敗
            }
          }
        }

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
        serverTime?: string
      }>('/api/auth/login', {
        method: 'POST',
        body: { loginId, password: pass },
      })

      if (response.success) {
        token.value = response.token
        currentUser.value = response.user
        setServerTimeOffset(response.serverTime)

        if (import.meta.client) {
          localStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(response.user))
        }

        if (response.mustChangePassword) {
          return { success: true, mustChangePassword: true }
        }

        return { success: true }
      }

      return { success: false, message: 'ログインに失敗しました。' }
    }
    catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string, message?: string } }
      const msg
        = fetchErr?.data?.statusMessage
          || fetchErr?.data?.message
          || 'ログインIDまたはパスワードが違います。'

      return { success: false, message: msg }
    }
  }

  const logout = () => {
    token.value = null
    currentUser.value = null

    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEYS.CACHED_USER)
    }

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
    getAccurateNow,
  }
}
