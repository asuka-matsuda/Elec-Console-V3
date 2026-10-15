/**
 * ファイル名サニタイズ共通ユーティリティ（SSoT）
 * OS上で不正となるファイル名禁止文字（\ / : * ? " < > |）を安全な代替文字（_）に置換します。
 */

const FORBIDDEN_FILENAME_CHARS = /[\\/:*?"<>|]/g

/**
 * ファイル名またはパス末尾の名称から禁止文字を安全に除去・置換
 */
export function sanitizeFilename(name?: string | null, fallback = 'ファイル'): string {
  if (!name || typeof name !== 'string') {
    return fallback
  }

  const cleaned = name.replace(FORBIDDEN_FILENAME_CHARS, '_').trim()

  return cleaned || fallback
}

const FORBIDDEN_SHEET_NAME_CHARS = /[\\/?*[\]:]/g

/**
 * Excelのワークシート名として安全な文字列に変換（最大31文字・禁止文字除去）
 */
export function sanitizeSheetName(name?: string | null, fallback = 'Sheet'): string {
  if (!name || typeof name !== 'string') {
    return fallback.slice(0, 31)
  }

  const cleaned = name.replace(FORBIDDEN_SHEET_NAME_CHARS, '').trim()
  const safe = cleaned || fallback

  return safe.slice(0, 31)
}
