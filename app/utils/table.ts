/**
 * テーブルデータ探索・キー解決ユーティリティ
 */

/**
 * 行データから一意な行識別子（キー）を取得します。
 *
 * @param row 行データオブジェクト
 * @param index 行インデックス番号
 * @param rowKey 行キー指定プロパティ名または取得関数
 */
export function getTableRowKey<T = unknown>(
  row: T,
  index: number,
  rowKey?: string | ((row: T) => string | number),
): string | number {
  if (typeof rowKey === 'function') {
    return rowKey(row)
  }

  const record = row as Record<string, unknown> | null | undefined

  if (rowKey && record && rowKey in record) {
    const value = record[rowKey]

    if (typeof value === 'string' || typeof value === 'number') {
      return value
    }
  }

  if (record && 'id' in record) {
    const idValue = record.id

    if (typeof idValue === 'string' || typeof idValue === 'number') {
      return idValue
    }
  }

  return index
}

/**
 * ネストプロパティ（ドット記法）に対応した安全なセル値取得関数
 *
 * @param row 行データオブジェクト
 * @param key カラムキー（例: 'user.name' または 'id'）
 */
export function getTableCellValue(row: unknown, key?: string | number): unknown {
  if (!row || !key || typeof row !== 'object') return undefined
  const record = row as Record<string, unknown>
  const keyStr = String(key)

  // 1. ドット記法によるネストパスアクセス
  if (keyStr.includes('.')) {
    const parts = keyStr.split('.')
    let current: unknown = record

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined
      }
      current = (current as Record<string, unknown>)[part]
    }

    return current
  }

  // 2. 単一プロパティアクセス（未定義時は undefined）
  return record[keyStr]
}
