/**
 * アプリケーション統一エラーハンドリングユーティリティ
 *
 * API エラーレスポンスの AppException への正規化、エラーコード変換およびメッセージ解決を提供します。
 */

import {
  type ApiErrorPayload,
  DEFAULT_ERROR_MESSAGES,
  ERROR_SHORT_CODES,
  ErrorCode,
} from '#shared/types/errors'

interface AppExceptionOptions {
  code: ErrorCode
  message?: string
  statusCode?: number
  shortCode?: string
  details?: Record<string, unknown>
  traceId?: string
  originalError?: unknown
}

/**
 * アプリケーション統一例外クラス
 * サーバーから返却されたエラーおよびクライアント側エラーを統一的に表現します。
 */
export class AppException extends Error {
  readonly code: ErrorCode
  readonly shortCode: string
  readonly statusCode: number
  readonly details?: Record<string, unknown>
  readonly traceId?: string
  readonly originalError?: unknown

  constructor(options: AppExceptionOptions) {
    const code = options.code
    const message
      = options.message
        || DEFAULT_ERROR_MESSAGES[code]
        || 'エラーが発生しました。'

    super(message)
    this.name = 'AppException'
    this.code = code
    this.shortCode = options.shortCode || ERROR_SHORT_CODES[code] || 'E-SYS-999'
    this.statusCode = options.statusCode || 500
    this.details = options.details
    this.traceId = options.traceId
    this.originalError = options.originalError

    // V8 スタックトレースの調整
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppException)
    }
  }

  /**
   * UI画面・トースト・アラート等に表示する整形済みメッセージを取得
   * 例: "[E-USR-002] 指定されたログインIDは既に使用されています。"
   * 例: "[E-SYS-999] 予期せぬシステムエラーが発生しました。(問合せ番号: ERR-20260920-ABCD)"
   */
  getUserFacingMessage(): string {
    let msg = `[${this.shortCode}] ${this.message}`

    if (this.traceId) {
      msg += ` (問合せ番号: ${this.traceId})`
    }

    return msg
  }

  /**
   * 指定したエラーコードと一致するか判定
   */
  is(code: ErrorCode): boolean {
    return this.code === code
  }

  /**
   * 排他制御（409 Conflict）エラーか判定
   */
  isConflict(): boolean {
    return this.code === ErrorCode.CIRCUIT_VERSION_CONFLICT || this.statusCode === 409
  }

  /**
   * 認証エラー（401 Unauthorized）か判定
   */
  isUnauthorized(): boolean {
    return this.code === ErrorCode.AUTH_UNAUTHORIZED || this.statusCode === 401
  }
}

/**
 * 任意の未知のエラー（FetchError, 通常のError, オブジェクト等）を安全に AppException に変換する
 */
export function parseToAppException(err: unknown): AppException {
  if (err instanceof AppException) {
    return err
  }

  // ofetch または h3 のエラーレスポンス構造をチェック
  const fetchErr = err as {
    statusCode?: number
    status?: number
    name?: string
    message?: string
    data?: ApiErrorPayload | { message?: string, statusMessage?: string, data?: unknown }
  }

  const statusCode = fetchErr.statusCode ?? fetchErr.status
  const data = fetchErr.data

  // 1. サーバーから ApiErrorPayload 形式でエラーコードが返ってきた場合
  if (data && typeof data === 'object' && 'code' in data && data.code in ERROR_SHORT_CODES) {
    const payload = data as ApiErrorPayload

    return new AppException({
      code: payload.code,
      message: payload.message || fetchErr.message,
      shortCode: payload.shortCode,
      statusCode: statusCode ?? 500,
      details: payload.details,
      traceId: payload.traceId,
      originalError: err,
    })
  }

  // 2. ネットワーク通信障害（オフライン、FetchError、TypeError: Failed to fetch 等）
  const isExplicitNetworkError
    = (statusCode === 0)
      || (fetchErr.name === 'FetchError' && fetchErr.message?.includes('Failed to fetch'))
      || (err instanceof TypeError && err.message.toLowerCase().includes('fetch'))

  if (isExplicitNetworkError) {
    return new AppException({
      code: ErrorCode.SYS_NETWORK_ERROR,
      message: DEFAULT_ERROR_MESSAGES[ErrorCode.SYS_NETWORK_ERROR],
      statusCode: 0,
      originalError: err,
    })
  }

  // 3. サーバーダウン・ゲートウェイエラー (502, 503, 504)
  if (statusCode === 502 || statusCode === 503 || statusCode === 504) {
    return new AppException({
      code: ErrorCode.SYS_SERVER_UNAVAILABLE,
      message: DEFAULT_ERROR_MESSAGES[ErrorCode.SYS_SERVER_UNAVAILABLE],
      statusCode,
      originalError: err,
    })
  }

  const dataRecord = (data && typeof data === 'object') ? (data as Record<string, unknown>) : null

  // 4. 404 Not Found
  if (statusCode === 404) {
    const msg = typeof dataRecord?.message === 'string' ? dataRecord.message : DEFAULT_ERROR_MESSAGES[ErrorCode.SYS_NOT_FOUND]

    return new AppException({
      code: ErrorCode.SYS_NOT_FOUND,
      message: msg,
      statusCode: 404,
      originalError: err,
    })
  }

  // 5. 429 Too Many Requests
  if (statusCode === 429) {
    const msg = typeof dataRecord?.message === 'string' ? dataRecord.message : DEFAULT_ERROR_MESSAGES[ErrorCode.SYS_RATE_LIMITED]

    return new AppException({
      code: ErrorCode.SYS_RATE_LIMITED,
      message: msg,
      statusCode: 429,
      originalError: err,
    })
  }

  // 6. その他の未知エラー（フォールバック）
  const fallbackMessage
    = (typeof dataRecord?.message === 'string' && dataRecord.message)
      || (typeof dataRecord?.statusMessage === 'string' && dataRecord.statusMessage)
      || fetchErr.message
      || DEFAULT_ERROR_MESSAGES[ErrorCode.SYS_UNKNOWN_ERROR]

  return new AppException({
    code: ErrorCode.SYS_UNKNOWN_ERROR,
    message: fallbackMessage,
    statusCode: statusCode || 500,
    originalError: err,
  })
}
