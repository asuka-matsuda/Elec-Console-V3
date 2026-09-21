import type { NitroApp } from 'nitropack/types'

import {
  type ApiErrorPayload,
  DEFAULT_ERROR_MESSAGES,
  ERROR_SHORT_CODES,
  ErrorCode,
} from '#shared/types/errors'

import { generateTraceId } from '../utils/error'

interface ExtendedH3Error {
  name?: string
  statusCode?: number
  statusMessage?: string
  message?: string
  stack?: string
  data?: unknown
  cause?: unknown
}

export default (nitroApp: NitroApp) => {
  nitroApp.hooks.hook('error', (error: unknown, { event }) => {
    const err = error as ExtendedH3Error
    const statusCode = err.statusCode || 500
    const url = event ? event.node.req.url : 'unknown'
    const method = event ? event.node.req.method : 'unknown'

    // 既に createAppError でコード付けされている既知エラーか確認
    const existingData = (err.data && typeof err.data === 'object') ? (err.data as Partial<ApiErrorPayload>) : null
    const hasKnownCode = Boolean(existingData?.code && Object.values(ErrorCode).includes(existingData.code as ErrorCode))

    if (hasKnownCode) {
      // 既知のエラー（4xx など通常の業務・バリデーションエラー）
      if (statusCode >= 500) {
        console.error(`[API 5xx Error] [${existingData?.code}] ${method} ${url}:`, err.message)
      }

      return
    }

    // --- 未知のエラー（予期せぬ例外、Prismaエラー、未捕捉のエラー） ---
    const traceId = generateTraceId()

    // 1. サーバーログには完全なコンテキストとスタックトレースを詳細出力
    console.error(`[Unhandled Server Error] [${traceId}] ${method} ${url}:`, {
      statusCode,
      name: err.name || 'Error',
      message: err.message,

      stack: err.stack,
      cause: err.cause,
    })

    // 2. クライアントに返却する情報を安全にマスク（内部SQLやコード構造の漏洩を防止）
    err.statusCode = statusCode
    err.statusMessage = ErrorCode.SYS_UNKNOWN_ERROR

    const safeMessage = statusCode === 404
      ? (DEFAULT_ERROR_MESSAGES[ErrorCode.SYS_NOT_FOUND] || '指定されたリソースが見つかりません。')
      : (DEFAULT_ERROR_MESSAGES[ErrorCode.SYS_UNKNOWN_ERROR] || '予期せぬシステムエラーが発生しました。')

    const payload: ApiErrorPayload = {
      code: statusCode === 404 ? ErrorCode.SYS_NOT_FOUND : ErrorCode.SYS_UNKNOWN_ERROR,
      shortCode: statusCode === 404 ? ERROR_SHORT_CODES[ErrorCode.SYS_NOT_FOUND] : ERROR_SHORT_CODES[ErrorCode.SYS_UNKNOWN_ERROR],
      message: safeMessage,
      traceId,
    }

    err.message = safeMessage
    err.data = payload
  })
}
