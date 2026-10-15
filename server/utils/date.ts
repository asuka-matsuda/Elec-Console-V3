/**
 * サーバー側 日時フォーマット共通ユーティリティ
 *
 * サーバーログやAPIレスポンスの日時フォーマットを一元化します。
 */

import { formatTime } from '#shared/utils/date'

const JST_OFFSET_MS = 9 * 60 * 60 * 1000

/**
 * 送信同期ログ用の時刻文字列 (HH:mm) を安全に生成する
 */
export const formatSyncTimeString = (date: unknown = new Date()): string => {
  return formatTime(date, '--:--')
}

/**
 * 任意の入力値を検証し、有効な Date インスタンスに変換する（不正な日時は null を返す）
 */
export function parseValidDate(val: unknown): Date | null {
  if (!val) return null
  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? null : val
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val)

    return Number.isNaN(d.getTime()) ? null : d
  }

  return null
}

/**
 * サーバーOSのタイムゾーンに依存せず、JST (+09:00) 基準での当月末日 23:59:59.999 の Date を算出する
 */
export function getJstEndOfMonth(now: Date = new Date()): Date {
  const jstDate = new Date(now.getTime() + JST_OFFSET_MS)
  const jstYear = jstDate.getUTCFullYear()
  const jstMonth = jstDate.getUTCMonth()

  // JST の翌月0日目 (= 当月末日) 23:59:59.999 を UTC ミリ秒に変換して JST オフセットを引く
  const endOfMonthUtcMs = Date.UTC(jstYear, jstMonth + 1, 0, 23, 59, 59, 999) - JST_OFFSET_MS

  return new Date(endOfMonthUtcMs)
}
