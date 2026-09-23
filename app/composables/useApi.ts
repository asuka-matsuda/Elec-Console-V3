/**
 * 共通 API クライアント Composable
 *
 * @description 型安全な HTTP 通信およびエラーハンドリングをラップした API 呼び出しを提供します。
 */

import { useNuxtApp } from '#app'

/**
 * 共通 API クライアント ($api)
 * plugins/api.ts で生成・提供されている $api インスタンスを一元取得します。
 */
export const useApi = () => {
  const { $api } = useNuxtApp()

  return {
    $api,
  }
}
