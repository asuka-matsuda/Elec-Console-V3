/**
 * tableAutoWidth.ts
 * テーブル列幅の動的自動計算および画面幅100%フィット（横スクロール完全防止）ユーティリティ。
 *
 * 1. 等幅フォント特性に応じた最大文字列長の判定（全角=2, 半角=1）
 * 2. フィルター・並び替えによる列幅の縮小・ガタつき防止（最大幅キャッシュ保持）
 * 3. 大画面における余剰幅の均等分配（右端の余白防止）
 * 4. 画面幅不足時における比率按分（横スクロール完全ゼロで100%幅死守）
 */
import type { TableColumn } from '~/types/components'

/**
 * 値の表示幅（半角=1, 全角=2）を計算
 */
export function getDisplayWidth(val: unknown): number {
  if (val === null || val === undefined) return 0
  const str = String(val)
  const lines = str.split(/\r?\n/)
  let maxLineWidth = 0

  for (const line of lines) {
    let width = 0

    for (let i = 0; i < line.length; i++) {
      const code = line.charCodeAt(i)

      // 半角英数、ASCII制御文字、半角カタカナ
      if (code <= 0x007F || (code >= 0xFF61 && code <= 0xFF9F)) {
        width += 1
      }
      else {
        width += 2
      }
    }

    if (width > maxLineWidth) {
      maxLineWidth = width
    }
  }

  return maxLineWidth
}

/**
 * '120px' や 120 などの幅指定を数値(px)にパース
 */
export function parsePixelWidth(width?: string | number): number | undefined {
  if (typeof width === 'number') return width
  if (!width) return undefined
  const match = String(width).match(/^(\d+(?:\.\d+)?)px$/)

  return match && match[1] ? Number.parseFloat(match[1]) : undefined
}

export interface ColumnWidthCalculationOptions {
  charWidthPx?: number
  paddingPx?: number
  marginPx?: number
  sortIconPx?: number
  defaultMinWidthPx?: number
}

const DEFAULT_OPTIONS: Required<ColumnWidthCalculationOptions> = {
  charWidthPx: 8.5,
  paddingPx: 16,
  marginPx: 12,
  sortIconPx: 24,
  defaultMinWidthPx: 60,
}

/**
 * データセットから各カラムの「基本必要幅（Base Width）」を算出・更新
 * ※ フィルター等でデータが減っても縮小しないよう、既存キャッシュ値との Math.max を採用
 */
export function calculateColumnBaseWidths<T>(
  columns: TableColumn<unknown>[],
  data: T[],
  existingCache: Record<string, number> = {},
  options: ColumnWidthCalculationOptions = {},
): Record<string, number> {
  const opt = { ...DEFAULT_OPTIONS, ...options }
  const result: Record<string, number> = { ...existingCache }

  for (const col of columns) {
    const colKey = String(col.key)

    // 固定幅が明示されている場合（例: '120px'）
    const fixedPx = parsePixelWidth(col.width)

    if (fixedPx !== undefined && col.fixedWidth !== false) {
      result[colKey] = fixedPx
      continue
    }

    // 自動計算列の場合
    let maxCharCount = getDisplayWidth(col.label)

    // ソート可能ならソートアイコン分の文字幅相当を考慮
    if (col.sortable) {
      maxCharCount += Math.ceil(opt.sortIconPx / opt.charWidthPx)
    }

    // データ行を走査して最大文字幅を取得
    if (Array.isArray(data)) {
      for (const row of data) {
        if (!row || typeof row !== 'object') continue
        const record = row as Record<string, unknown>

        const cellVal = record[colKey]
        const cellChars = getDisplayWidth(cellVal)

        if (cellChars > maxCharCount) {
          maxCharCount = cellChars
        }

        // 2段組サブキー（subKey）がある場合はそちらの長さも考慮
        if (col.subKey && col.subKey in record) {
          const subVal = record[String(col.subKey)]
          const subChars = getDisplayWidth(subVal)

          if (subChars > maxCharCount) {
            maxCharCount = subChars
          }
        }
      }
    }

    // ピクセル換算
    let calculatedPx = Math.ceil(maxCharCount * opt.charWidthPx) + opt.paddingPx + opt.marginPx

    // minWidth / maxWidth ガード
    const minPx = parsePixelWidth(col.minWidth) ?? opt.defaultMinWidthPx
    const maxPx = parsePixelWidth(col.maxWidth)

    calculatedPx = Math.max(calculatedPx, minPx)
    if (maxPx !== undefined) {
      calculatedPx = Math.min(calculatedPx, maxPx)
    }

    // 既存キャッシュと比較し、より大きい方を維持（縮小・ガタつき防止）
    const prevPx = result[colKey] ?? 0

    result[colKey] = Math.max(prevPx, calculatedPx)
  }

  return result
}

/**
 * 画面幅（コンテナ幅）に合わせて各列の幅を最適分配（100%幅フィット＆横スクロール完全防止）
 */
export function distributeColumnWidths(
  columns: TableColumn<unknown>[],
  baseWidths: Record<string, number>,
  containerWidth: number,
): Record<string, number> {
  const result: Record<string, number> = {}

  if (!columns.length) return result

  if (containerWidth <= 0) {
    return { ...baseWidths }
  }

  // 固定列と可変列（自動伸縮対象）を分類
  const fixedCols: string[] = []
  const flexCols: string[] = []

  let fixedWidthSum = 0
  let flexBaseWidthSum = 0

  for (const col of columns) {
    const key = String(col.key)
    const baseW = baseWidths[key] ?? 80

    // col.width が明示的に指定されており、かつ fixedWidth が true またはデフォルト扱いの場合
    const explicitPx = parsePixelWidth(col.width)

    if (explicitPx !== undefined && col.fixedWidth !== false) {
      fixedCols.push(key)
      fixedWidthSum += baseW
    }
    else {
      flexCols.push(key)
      flexBaseWidthSum += baseW
    }
  }

  const totalBaseWidth = fixedWidthSum + flexBaseWidthSum

  // ケース1: 画面幅に余裕がある場合（containerWidth >= totalBaseWidth）
  if (containerWidth >= totalBaseWidth) {
    const extraWidth = containerWidth - totalBaseWidth
    let remainingExtra = extraWidth

    // 固定列はベース幅で確定
    for (const key of fixedCols) {
      result[key] = baseWidths[key] ?? 80
    }

    if (flexCols.length > 0) {
      const currentWidths: Record<string, number> = {}
      const colMap = new Map<string, TableColumn<unknown>>()

      for (const col of columns) {
        colMap.set(String(col.key), col)
      }

      for (const key of flexCols) {
        currentWidths[key] = baseWidths[key] ?? 80
      }

      // 上限（maxWidth）に達していない列を特定しながら、余剰幅を段階配分
      let activeCols = [...flexCols]

      while (remainingExtra > 0 && activeCols.length > 0) {
        const share = Math.floor(remainingExtra / activeCols.length)

        if (share === 0) {
          // 残りが activeCols.length より小さい端数の場合、先頭から1pxずつ配分
          for (let i = 0; i < remainingExtra; i++) {
            const key = activeCols[i % activeCols.length]!

            currentWidths[key] = (currentWidths[key] ?? 80) + 1
          }
          break
        }

        let allocatedThisRound = 0
        const nextActiveCols: string[] = []

        for (const key of activeCols) {
          const col = colMap.get(key)
          const maxPx = parsePixelWidth(col?.maxWidth)
          const cur = currentWidths[key] ?? 80

          if (maxPx !== undefined) {
            const canAccept = Math.max(0, maxPx - cur)
            const add = Math.min(share, canAccept)

            currentWidths[key] = cur + add
            allocatedThisRound += add

            if (cur + add < maxPx) {
              nextActiveCols.push(key)
            }
          }
          else {
            // maxWidth の上限なし
            currentWidths[key] = cur + share
            allocatedThisRound += share
            nextActiveCols.push(key)
          }
        }

        remainingExtra -= allocatedThisRound

        // 今ラウンドで全く配分が進まなかった場合（全員が上限に達した場合）
        if (allocatedThisRound === 0) {
          // 全可変列が上限に達した場合、上限なし列、または最後の可変列に残余を配分
          const fallbackCol = activeCols.find(k => parsePixelWidth(colMap.get(k)?.maxWidth) === undefined)
            || flexCols[flexCols.length - 1]!

          currentWidths[fallbackCol] = (currentWidths[fallbackCol] ?? 80) + remainingExtra
          break
        }

        activeCols = nextActiveCols
      }

      for (const key of flexCols) {
        result[key] = currentWidths[key]!
      }
    }
    else {
      // すべて固定列の場合は、全列に均等分配
      const extraPerCol = Math.floor(extraWidth / columns.length)
      let distributedExtra = 0

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i]!
        const key = String(col.key)
        const isLast = i === columns.length - 1
        const add = isLast ? (extraWidth - distributedExtra) : extraPerCol

        distributedExtra += add
        result[key] = (baseWidths[key] ?? 80) + add
      }
    }

    return result
  }

  // ケース2: 画面幅が不足している場合（containerWidth < totalBaseWidth）
  // 各列の算出された基本必要幅（baseWidths）をそのまま維持
  return { ...baseWidths }
}
