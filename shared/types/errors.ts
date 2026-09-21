/**
 * 共有エラーコード体系 & エラー型定義
 * サーバーとクライアント（Nuxt 4 / shared）の双方が参照するエラー仕様のシングルソースです。
 */

export const ErrorCode = {
  // --- システム・未知・インフラ系 (SYS) ---
  SYS_UNKNOWN_ERROR: 'SYS_UNKNOWN_ERROR',
  SYS_INTERNAL_ERROR: 'SYS_INTERNAL_ERROR',
  SYS_NETWORK_ERROR: 'SYS_NETWORK_ERROR',
  SYS_SERVER_UNAVAILABLE: 'SYS_SERVER_UNAVAILABLE',
  SYS_VALIDATION_FAILED: 'SYS_VALIDATION_FAILED',
  SYS_RATE_LIMITED: 'SYS_RATE_LIMITED',
  SYS_NOT_FOUND: 'SYS_NOT_FOUND',
  SYS_METHOD_NOT_ALLOWED: 'SYS_METHOD_NOT_ALLOWED',

  // --- 認証・認可系 (AUTH) ---
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_ACCOUNT_INACTIVE: 'AUTH_ACCOUNT_INACTIVE',
  AUTH_FORBIDDEN_ACTION: 'AUTH_FORBIDDEN_ACTION',
  AUTH_PASSWORD_POLICY_VIOLATION: 'AUTH_PASSWORD_POLICY_VIOLATION',

  // --- ユーザー管理系 (USER) ---
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_LOGIN_ID_DUPLICATE: 'USER_LOGIN_ID_DUPLICATE',
  USER_MASTER_PROTECTED: 'USER_MASTER_PROTECTED',
  USER_SELF_DEMOTION_DENIED: 'USER_SELF_DEMOTION_DENIED',
  USER_LAST_ADMIN_DENIED: 'USER_LAST_ADMIN_DENIED',

  // --- 現場・回路・排他制御系 (CIRCUIT / SITE) ---
  SITE_NOT_FOUND: 'SITE_NOT_FOUND',
  CIRCUIT_NOT_FOUND: 'CIRCUIT_NOT_FOUND',
  CIRCUIT_VERSION_CONFLICT: 'CIRCUIT_VERSION_CONFLICT',
  CIRCUIT_IMPORT_INVALID: 'CIRCUIT_IMPORT_INVALID',

  // --- UI・クライアントランタイム系 (UI) ---
  UI_UNHANDLED_ERROR: 'UI_UNHANDLED_ERROR',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

/**
 * 問い合わせ・サポート用短縮エラーコード
 */
export const ERROR_SHORT_CODES: Record<ErrorCode, string> = {
  // システム・未知系
  [ErrorCode.SYS_UNKNOWN_ERROR]: 'E-SYS-999',
  [ErrorCode.SYS_INTERNAL_ERROR]: 'E-SYS-500',
  [ErrorCode.SYS_NETWORK_ERROR]: 'E-SYS-002',
  [ErrorCode.SYS_SERVER_UNAVAILABLE]: 'E-SYS-003',
  [ErrorCode.SYS_VALIDATION_FAILED]: 'E-SYS-400',
  [ErrorCode.SYS_RATE_LIMITED]: 'E-SYS-429',
  [ErrorCode.SYS_NOT_FOUND]: 'E-SYS-404',
  [ErrorCode.SYS_METHOD_NOT_ALLOWED]: 'E-SYS-405',

  // 認証・認可系
  [ErrorCode.AUTH_UNAUTHORIZED]: 'E-ATH-001',
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'E-ATH-002',
  [ErrorCode.AUTH_ACCOUNT_INACTIVE]: 'E-ATH-003',
  [ErrorCode.AUTH_FORBIDDEN_ACTION]: 'E-ATH-004',
  [ErrorCode.AUTH_PASSWORD_POLICY_VIOLATION]: 'E-ATH-005',

  // ユーザー管理系
  [ErrorCode.USER_NOT_FOUND]: 'E-USR-001',
  [ErrorCode.USER_LOGIN_ID_DUPLICATE]: 'E-USR-002',
  [ErrorCode.USER_MASTER_PROTECTED]: 'E-USR-003',
  [ErrorCode.USER_SELF_DEMOTION_DENIED]: 'E-USR-004',
  [ErrorCode.USER_LAST_ADMIN_DENIED]: 'E-USR-005',

  // 現場・回路系
  [ErrorCode.SITE_NOT_FOUND]: 'E-SIT-001',
  [ErrorCode.CIRCUIT_NOT_FOUND]: 'E-CIR-001',
  [ErrorCode.CIRCUIT_VERSION_CONFLICT]: 'E-CIR-002',
  [ErrorCode.CIRCUIT_IMPORT_INVALID]: 'E-CIR-003',

  // UI・クライアント系
  [ErrorCode.UI_UNHANDLED_ERROR]: 'E-UI-999',
}

/**
 * 各エラーコードのデフォルトメッセージ（フォールバック用）
 */
export const DEFAULT_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.SYS_UNKNOWN_ERROR]: '予期せぬシステムエラーが発生しました。時間をおいて再度お試しください。',
  [ErrorCode.SYS_INTERNAL_ERROR]: 'システム内部でエラーが発生しました。',
  [ErrorCode.SYS_NETWORK_ERROR]: 'サーバーと通信できません。インターネット接続またはVPNをご確認ください。',
  [ErrorCode.SYS_SERVER_UNAVAILABLE]: 'サーバーが一時的に応答していません。メンテナンス中か一時的な障害の可能性があります。',
  [ErrorCode.SYS_VALIDATION_FAILED]: '入力内容に不備があります。内容をご確認ください。',
  [ErrorCode.SYS_RATE_LIMITED]: 'リクエスト回数が制限を超えました。しばらく待ってから再度お試しください。',
  [ErrorCode.SYS_NOT_FOUND]: '指定されたリソースが見つかりませんでした。',
  [ErrorCode.SYS_METHOD_NOT_ALLOWED]: '許可されていないリクエスト方法です。',

  [ErrorCode.AUTH_UNAUTHORIZED]: 'ログインが必要です。再度ログインしてください。',
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'ログインIDまたはパスワードが正しくありません。',
  [ErrorCode.AUTH_ACCOUNT_INACTIVE]: 'このアカウントは無効化されています。管理者にお問い合わせください。',
  [ErrorCode.AUTH_FORBIDDEN_ACTION]: 'この操作を行う権限がありません。',
  [ErrorCode.AUTH_PASSWORD_POLICY_VIOLATION]: 'パスワードが設定要件を満たしていません。',

  [ErrorCode.USER_NOT_FOUND]: '指定されたユーザーが見つかりません。',
  [ErrorCode.USER_LOGIN_ID_DUPLICATE]: '指定されたログインIDは既に使用されています。',
  [ErrorCode.USER_MASTER_PROTECTED]: 'マスター管理者のアカウントは変更・削除・降格できません。',
  [ErrorCode.USER_SELF_DEMOTION_DENIED]: '自分自身のアカウントの無効化または管理者権限の剥奪はできません。',
  [ErrorCode.USER_LAST_ADMIN_DENIED]: 'システム内に有効な管理者が1人のみのため、無効化または降格できません。',

  [ErrorCode.SITE_NOT_FOUND]: '指定された現場が見つかりません。',
  [ErrorCode.CIRCUIT_NOT_FOUND]: '指定された回路が見つかりません。',
  [ErrorCode.CIRCUIT_VERSION_CONFLICT]: '他の作業者によってデータが更新されました。最新データを反映しました。確認の上、再度実行してください。',
  [ErrorCode.CIRCUIT_IMPORT_INVALID]: 'インポートファイルの形式が不正です。',

  [ErrorCode.UI_UNHANDLED_ERROR]: '画面の表示処理中に予期せぬエラーが発生しました。',
}

/**
 * 統一エラーレスポンスのペイロードインターフェース
 */
export interface ApiErrorPayload {
  code: ErrorCode
  shortCode: string
  message: string
  details?: Record<string, unknown>
  traceId?: string
}

/**
 * 統一エラーレスポンス構造
 */
export interface ApiErrorResponse {
  statusCode: number
  statusMessage?: string
  data: ApiErrorPayload
}
