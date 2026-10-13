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
