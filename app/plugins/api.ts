/**
 * API クライアント（$api）Nuxt プラグイン
 *
 * 認証トークン（Bearer / Cookie）の自動付与、401認証エラー時のセッション破棄・リダイレクト、
 * およびレスポンスエラーの AppException への正規化ハンドリングを提供します。
 */

import { defineNuxtPlugin, navigateTo, useCookie, useRoute, useState } from '#app'
import type { User } from '~/types/auth'
import { parseToAppException } from '~/utils/errors'

export default defineNuxtPlugin(() => {
  const token = useCookie<string | null>('auth_token', {
    default: () => null,
    maxAge: 60 * 60 * 24,
  })
  const currentUser = useState<User | null>('currentUser', () => null)

  const rawFetch = $fetch.create({
    onRequest({ options }) {
      if (token.value) {
        const headers = new Headers(options.headers || {})

        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token.value}`)
        }
        if (!headers.has('Cookie')) {
          headers.set('Cookie', `auth_token=${token.value}`)
        }
        options.headers = headers
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        token.value = null
        currentUser.value = null

        // ログイン画面そのものでの 401（パスワード違い等）の場合はリダイレクトループを避ける
        if (import.meta.client) {
          const route = useRoute()

          if (route.path !== '/login') {
            navigateTo('/login')
          }
        }
      }
    },
  })

  // $api 呼び出しで発生した例外を自動的に AppException に変換してスロー
  const $api = (async (
    request: Parameters<typeof rawFetch>[0],
    opts?: Parameters<typeof rawFetch>[1],
  ) => {
    try {
      return await (rawFetch as (...args: unknown[]) => Promise<unknown>)(request, opts)
    }
    catch (err: unknown) {
      throw parseToAppException(err)
    }
  }) as typeof rawFetch

  // rawFetch の全プロパティ・ユーティリティ（create, raw 等）を透過継承
  Object.assign($api, rawFetch)

  return {
    provide: {
      api: $api,
    },
  }
})
