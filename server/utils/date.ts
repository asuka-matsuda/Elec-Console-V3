/**
 * サーバー側 日時フォーマット共通ユーティリティ
 *
 * サーバーログやAPIレスポンスの日時フォーマットを一元化します。
 */

import { formatTime } from '#shared/utils/date'

/**
 * 送信同期ログ用の時刻文字列 (HH:mm) を安全に生成する
 */
export const formatSyncTimeString = (date: unknown = new Date()): string => {
  return formatTime(date, '--:--')
}
