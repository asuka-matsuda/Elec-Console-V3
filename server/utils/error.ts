/**
 * サーバー側エラー生成・追跡ユーティリティ
 *
 * 一意な Trace ID の生成、HTTP エラーコード付き AppException の生成を提供します。
 */

import crypto from 'node:crypto'

import { createError } from 'h3'

import {
  type ApiErrorPayload,
  DEFAULT_ERROR_MESSAGES,
  ERROR_SHORT_CODES,
  ErrorCode,
} from '#shared/types/errors'

/**
 * 追跡用 Trace ID の生成 (例: ERR-20260920-A1B2)
 */
export function generateTraceId(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase()

  return `ERR-${y}${m}${d}-${rand}`
}

/**
 * エラーコードからデフォルトのHTTPステータスコードを取得
 */
export function getDefaultStatusCode(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.AUTH_UNAUTHORIZED:
    case ErrorCode.AUTH_INVALID_CREDENTIALS:
      return 401
    case ErrorCode.AUTH_ACCOUNT_INACTIVE:
    case ErrorCode.AUTH_FORBIDDEN_ACTION:
    case ErrorCode.USER_MASTER_PROTECTED:
      return 403
    case ErrorCode.SYS_NOT_FOUND:
    case ErrorCode.USER_NOT_FOUND:
    case ErrorCode.SITE_NOT_FOUND:
    case ErrorCode.CIRCUIT_NOT_FOUND:
      return 404
    case ErrorCode.SYS_METHOD_NOT_ALLOWED:
      return 405
    case ErrorCode.USER_LOGIN_ID_DUPLICATE:
    case ErrorCode.CIRCUIT_VERSION_CONFLICT:
      return 409
    case ErrorCode.SYS_RATE_LIMITED:
      return 429
    case ErrorCode.SYS_INTERNAL_ERROR:
    case ErrorCode.SYS_UNKNOWN_ERROR:
      return 500
    case ErrorCode.SYS_SERVER_UNAVAILABLE:
      return 503
    case ErrorCode.SYS_VALIDATION_FAILED:
    case ErrorCode.AUTH_PASSWORD_POLICY_VIOLATION:
    case ErrorCode.USER_SELF_DEMOTION_DENIED:
    case ErrorCode.USER_LAST_ADMIN_DENIED:
    case ErrorCode.CIRCUIT_IMPORT_INVALID:
    default:
      return 400
  }
}

export interface CreateAppErrorParams {
  code: ErrorCode
  message?: string
  statusCode?: number
  details?: Record<string, unknown>
  cause?: unknown
  traceId?: string
}

/**
 * 統一フォーマットのH3エラーオブジェクトを生成するヘルパー関数
 */
export function createAppError(params: CreateAppErrorParams) {
  const { code, details, cause, traceId } = params
  const statusCode = params.statusCode || getDefaultStatusCode(code)
  const message = params.message || DEFAULT_ERROR_MESSAGES[code] || 'エラーが発生しました。'
  const shortCode = ERROR_SHORT_CODES[code] || 'E-SYS-999'
  const payload: ApiErrorPayload & Record<string, unknown> = {
    code,
    shortCode,

    message,
    details,
    traceId,
    ...(details || {}),
  }

  return createError({
    statusCode,
    statusMessage: code,
    message,
    data: payload,
    cause,
  })
}
