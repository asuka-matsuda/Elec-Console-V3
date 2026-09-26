/**
 * 現場操作監査ログ共有型定義
 *
 * サーバーとクライアントの双方が参照する操作監査ログエンティティおよびAPIレスポンス型を定義します。
 */

/**
 * 現場操作監査ログアイテム
 */
export interface OperationLogItem {
  id: string
  siteId: string
  timestamp: string
  worker: string
  action: string
  targetBan?: string | null
  targetKairo?: string | null
  details?: string | null
}

/**
 * 操作ログ一覧APIレスポンス
 */
export interface OperationLogsResponse {
  logs: OperationLogItem[]
  availableWorkers: string[]
  availableActions: string[]
  availableTargetBans: string[]
  total: number
}
