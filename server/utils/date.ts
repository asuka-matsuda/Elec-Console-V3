/**
 * サーバー側 日時フォーマット共通ユーティリティ
 *
 * サーバーログやAPIレスポンスの日時フォーマットを一元化します。
 */

/**
 * 送信同期ログ用の時刻文字列 (HH:mm) を安全に生成する
 */
export const formatSyncTimeString = (date: unknown = new Date()): string => {
  const d = parseDateSafe(date)

  if (!d) return '--:--'

  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')

  return `${h}:${min}`
}
