/**
 * 認証・セッション管理 Composable (Local-First & Offline-Ready)
 *
 * @description ユーザーログイン・ログアウト、トークン永続化、権限ロール判定、
 * Web Crypto API による完全オフライン認証、およびサーバー時刻差分補正を管理します。
 */

import { computed } from 'vue'

import { useCookie, useNuxtApp, useRouter, useState } from '#app'
import type { User } from '#shared/types/auth'
import { STATE_KEYS } from '~/constants/storageKeys'
import { generateSalt, hashPasswordClient, verifyPasswordClient } from '~/utils/crypto'
import { AuthCacheRepository } from '~/utils/db'

// オフライン猶予期間: 30日間
const OFFLINE_AUTH_VALIDITY_DAYS = 30

export function useAuth() {
  const token = useCookie<string | null>('auth_token', {
    default: () => null,
    maxAge: 60 * 60 * 24 * OFFLINE_AUTH_VALIDITY_DAYS,
  })
  const currentUser = useState<User | null>(STATE_KEYS.CURRENT_USER, () => null)
  const isOfflineSession = useState<boolean>(STATE_KEYS.IS_OFFLINE_SESSION, () => false)
  const router = useRouter()

  const getApiSafe = () => {
    try {
      return useNuxtApp().$api
    }
    catch {
      return null
    }
  }

  const serverTimeOffset = useState<number>(STATE_KEYS.SERVER_TIME_OFFSET, () => 0)

  // サーバー時刻とのオフセット（差分ms）を更新・保存
  const setServerTimeOffset = (serverTimeIso?: string) => {
    if (!serverTimeIso) return

    try {
      const serverMs = new Date(serverTimeIso).getTime()
      const clientMs = Date.now()

      serverTimeOffset.value = serverMs - clientMs
    }
    catch {
      // タイムパース失敗時はスキップ
    }
  }

  // 補正された正確な現在時刻を取得（圏外時も端末RTC + オフセットで算出）
  const getAccurateNow = (): Date => {
    return new Date(Date.now() + serverTimeOffset.value)
  }

  // 補正された正確な現在時刻を ISO 文字列で取得
  const getAccurateNowIso = (): string => {
    return getAccurateNow().toISOString()
  }

  // ネットワーク・圏外エラー判定ヘルパー
  const isNetworkError = (err: unknown): boolean => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return true
    }

    const e = err as { name?: string, message?: string, statusCode?: number, status?: number }

    if (e?.name === 'TypeError' && (e?.message?.includes('fetch') || e?.message?.includes('Network'))) {
      return true
    }

    const status = e?.statusCode || e?.status

    // ネットワーク未到達、ゲートウェイタイムアウト、サーバー一時障害はオフライン扱い
    if (!status || status === 408 || status === 502 || status === 503 || status === 504) {
      return true
    }

    return false
  }

  const initAuth = async (force = false) => {
    const $api = getApiSafe()

    // 1. メモリに currentUser がなく、クライアント環境の場合、まず IndexedDB (AuthCacheRepository) から復元
    if (!currentUser.value && import.meta.client) {
      try {
        const cachedRecords = await AuthCacheRepository.getAll()

        if (cachedRecords.length > 0) {
          cachedRecords.sort((a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime())
          const latest = cachedRecords[0]!

          currentUser.value = latest.user
          if (typeof latest.serverTimeOffset === 'number') {
            serverTimeOffset.value = latest.serverTimeOffset
          }
        }
      }
      catch {
        // パース失敗無視
      }
    }

    if (!$api) return

    // 2. トークンがある場合はサーバーへセッション検証を試みる
    if (token.value && (!currentUser.value || force)) {
      try {
        const data = await $api<{ success: boolean, user: User, serverTime?: string }>(
          '/api/auth/me',
        )

        if (data && data.success && data.user) {
          currentUser.value = data.user
          isOfflineSession.value = false
          setServerTimeOffset(data.serverTime)
        }
        else if (!isOfflineSession.value) {
          logout()
        }
      }
      catch (_err: unknown) {
        // オフライン（圏外）またはネットワークエラー時はキャッシュから復元してセッションを維持
        if (import.meta.client) {
          isOfflineSession.value = true
          // すでに currentUser が復元されていれば何もしない
          if (currentUser.value) {
            return
          }

          // IndexedDB から復元を試行
          try {
            const cachedRecords = await AuthCacheRepository.getAll()

            if (cachedRecords.length > 0) {
              cachedRecords.sort((a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime())
              const latest = cachedRecords[0]!

              currentUser.value = latest.user
              if (typeof latest.serverTimeOffset === 'number') {
                serverTimeOffset.value = latest.serverTimeOffset
              }

              return
            }
          }
          catch {
            // パース失敗
          }
        }
      }
    }
  }

  const login = async (loginId: string, pass: string) => {
    const trimmedId = loginId.trim()
    const $api = getApiSafe()

    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine

    // 1. オンライン環境下でのサーバー認証試行
    if ($api && isOnline) {
      try {
        const response = await $api<{
          success: boolean
          token: string
          user: User
          mustChangePassword?: boolean
          serverTime?: string
        }>('/api/auth/login', {
          method: 'POST',
          body: { loginId: trimmedId, password: pass },
        })

        if (response && response.success) {
          token.value = response.token
          currentUser.value = response.user
          isOfflineSession.value = false
          setServerTimeOffset(response.serverTime)

          if (import.meta.client) {
            // 【Local-First】 オフライン暗号化クレデンシャルを IndexedDB に保存
            try {
              const salt = generateSalt(16)
              const hash = await hashPasswordClient(pass, salt)
              const now = new Date()
              const expiresAt = new Date(now.getTime() + OFFLINE_AUTH_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString()

              await AuthCacheRepository.put({
                loginId: response.user.loginId,
                user: response.user,
                passwordSalt: salt,
                passwordHash: hash,
                cachedAt: now.toISOString(),
                expiresAt,
                serverTimeOffset: serverTimeOffset.value,
              })
            }
            catch (cryptoErr) {
              console.warn('[useAuth] Failed to cache credentials for offline use', cryptoErr)
            }
          }

          if (response.mustChangePassword) {
            return { success: true, mustChangePassword: true }
          }

          return { success: true }
        }
      }
      catch (err: unknown) {
        // 401/403等の認証拒否エラーはサーバー側の意図的な拒否なのでそのまま返す
        const fetchErr = err as { statusCode?: number, status?: number, data?: { statusMessage?: string, message?: string } }
        const status = fetchErr.statusCode || fetchErr.status

        if (status === 401 || status === 403 || (!isNetworkError(err) && status)) {
          const msg = fetchErr?.data?.statusMessage || fetchErr?.data?.message || 'ログインIDまたはパスワードが違います。'

          return { success: false, message: msg }
        }
      }
    }

    // 2. 【完全オフライン認証】 ネットワークエラー・圏外時のフォールバック認証
    if (import.meta.client) {
      try {
        const cachedAuth = await AuthCacheRepository.get(trimmedId)

        if (!cachedAuth) {
          return {
            success: false,
            message: 'オフライン環境です。事前にオンラインで一度ログインしたアカウントのみ利用できます。',
          }
        }

        // 有効期限チェック（補正された現在時刻で判定）
        if (getAccurateNow() > new Date(cachedAuth.expiresAt)) {
          return {
            success: false,
            message: 'オフライン認証の有効期限が切れています。電波のある環境で再ログインしてください。',
          }
        }

        // パスワードの暗号照合 (Web Crypto API: PBKDF2)
        const isMatch = await verifyPasswordClient(pass, cachedAuth.passwordSalt, cachedAuth.passwordHash)

        if (isMatch) {
          // オフラインセッション確立
          currentUser.value = cachedAuth.user
          isOfflineSession.value = true
          if (typeof cachedAuth.serverTimeOffset === 'number') {
            serverTimeOffset.value = cachedAuth.serverTimeOffset
          }
          if (!token.value) {
            token.value = `offline_session_${cachedAuth.loginId}_${Date.now()}`
          }

          return { success: true, isOffline: true }
        }

        return { success: false, message: 'ログインIDまたはパスワードが違います。' }
      }
      catch (offlineErr) {
        console.error('[useAuth] Offline authentication failed', offlineErr)

        return { success: false, message: 'オフライン認証の実行中にエラーが発生しました。' }
      }
    }

    return { success: false, message: '通信環境を確認してください。' }
  }

  const changePassword = async (newPassword: string, currentPassword?: string) => {
    const $api = getApiSafe()

    if (!$api) return { success: false, message: 'APIクライアントが初期化されていません。' }

    try {
      await $api('/api/auth/password', {
        method: 'PUT',
        body: { newPassword, currentPassword },
      })

      if (currentUser.value) {
        currentUser.value.requirePasswordReset = false

        if (import.meta.client) {
          // オフラインキャッシュのパスワードも更新
          try {
            const cachedAuth = await AuthCacheRepository.get(currentUser.value.loginId)

            if (cachedAuth) {
              const salt = generateSalt(16)
              const hash = await hashPasswordClient(newPassword, salt)

              await AuthCacheRepository.put({
                ...cachedAuth,
                passwordSalt: salt,
                passwordHash: hash,
                user: currentUser.value,
              })
            }
          }
          catch (e) {
            console.warn('[useAuth] Failed to update offline credentials on password change', e)
          }
        }
      }

      return { success: true }
    }
    catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string, message?: string } }
      const msg
        = fetchErr?.data?.statusMessage
          || fetchErr?.data?.message
          || 'パスワードの変更に失敗しました。'

      return { success: false, message: msg }
    }
  }

  const logout = () => {
    token.value = null
    currentUser.value = null
    isOfflineSession.value = false

    router.push('/login')
  }

  const isAuthenticated = computed(() => !!token.value && !!currentUser.value)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isMaster = computed(() => currentUser.value?.loginId === 'master')

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    isMaster,
    isOfflineSession,
    login,
    changePassword,
    logout,
    initAuth,
    getAccurateNow,
    getAccurateNowIso,
  }
}
