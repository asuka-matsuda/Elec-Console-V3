/**
 * Vue グローバルエラーハンドラープラグイン
 *
 * コンポーネント描画中やライフサイクル内で発生した未捕捉エラーを統一ログ出力します。
 */

import { defineNuxtPlugin } from '#app'
import { ErrorCode } from '#shared/types/errors'
import { AppException } from '~/utils/errors'

/**
 * Vue アプリケーション全体の未処理例外ハンドラー
 * UIレンダリングやライフサイクル内の未知のエラーによる画面の全崩壊を防ぎ、
 * ログ記録と安全なフォールバックを行います。
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, _instance, info) => {
    console.error('[Vue Unhandled Error]:', {
      error,
      info,
    })

    if (error instanceof AppException) {
      // 既に AppException の場合は何もしない
      return
    }

    // 開発環境の場合はデバッグのためコンソールに警告
    if (import.meta.dev) {
      console.warn(`[UI Warning: ${ErrorCode.UI_UNHANDLED_ERROR}]`, error)
    }
  }
})
