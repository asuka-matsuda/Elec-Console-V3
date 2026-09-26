/**
 * テーブル列幅自動配分・画面フィットユーティリティ
 *
 * テーブル列幅の動的自動計算および画面幅100%フィット（横スクロール完全防止）を提供します。
 *
 * 1. 等幅フォント特性に応じた最大文字列長の判定（全角=2, 半角=1）
 * 2. フィルター・並び替えによる列幅の縮小・ガタつき防止（最大幅キャッシュ保持）
 * 3. 大画面における余剰幅の均等分配（右端の余白防止）
 * 4. 画面幅不足時における比率按分（横スクロール完全ゼロで100%幅死守）
 */
import type { TableColumn } from '~/types/components'

interface ColumnWidthCalculationOptions {
  charWidthPx?: number
  paddingPx?: number
  marginPx?: number
  sortIconPx?: number
  defaultMinWidthPx?: number
  actionsMinWidthPx?: number
  measuredMinWidths?: Record<string, number>
}

const DEFAULT_OPTIONS: Required<Omit<ColumnWidthCalculationOptions, 'measuredMinWidths'>> & { measuredMinWidths?: Record<string, number> } = {
  charWidthPx: 8.5,
  paddingPx: 16,
  marginPx: 12,
  sortIconPx: 24,
  defaultMinWidthPx: 60,
  actionsMinWidthPx: 120,
  measuredMinWidths: undefined,
}

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

/**
 * カラムの自動幅配分ウェイト（重み）を取得
 * 備考欄（keyにremarkを含む、またはlabelが「備考」）はデフォルトで2スロット分（weight=2）を割り当て
 */
function getColumnFlexWeight<T = Record<string, unknown>>(col?: TableColumn<T>): number {
  if (!col) return 1
  if (typeof col.flexWeight === 'number' && col.flexWeight > 0) {
    return col.flexWeight
  }
  const key = String(col.key).toLowerCase()
  const label = String(col.label || '')

  if (key.includes('remark') || label === '備考' || label.includes('備考')) {
    return 2
  }

  return 1
}

/**
 * カラムの見出しラベル・ソートアイコン・余白から「見出しの最小必要幅（Natural Min Width）」を算出
 */
function calculateHeaderMinWidth<T = Record<string, unknown>>(
  col: TableColumn<T>,
  options: ColumnWidthCalculationOptions = {},
): number {
  const opt = { ...DEFAULT_OPTIONS, ...options }
  const colKey = String(col.key)
  const explicitMinPx = parsePixelWidth(col.minWidth)

  // DOM実測されたコンテンツ最小必要幅があれば、それを最優先の物理下限とする
  const measuredPx = opt.measuredMinWidths?.[colKey]

  if (measuredPx !== undefined && measuredPx > 0) {
    return explicitMinPx !== undefined ? Math.max(explicitMinPx, measuredPx) : measuredPx
  }

  // 操作列（ボタンUIが描画されるカスタムセル）の場合の最小幅担保
  if (col.key === 'actions' || col.key === 'action') {
    const actionsMin = opt.actionsMinWidthPx

    return explicitMinPx !== undefined ? Math.max(explicitMinPx, actionsMin) : actionsMin
  }

  let labelCharCount = getDisplayWidth(col.label)

  // ソート可能ならソートアイコン分の文字幅を考慮
  if (col.sortable !== false) {
    labelCharCount += Math.ceil(opt.sortIconPx / opt.charWidthPx)
  }

  const headerPx = Math.ceil(labelCharCount * opt.charWidthPx) + opt.paddingPx + opt.marginPx

  return explicitMinPx !== undefined ? Math.max(explicitMinPx, headerPx) : Math.max(opt.defaultMinWidthPx, headerPx)
}

/**
 * データセットから各カラムの「基本必要幅（Base Width）」を算出・更新
 * ※ フィルター等でデータが減っても縮小しないよう、既存キャッシュ値との Math.max を採用
 */
export function calculateColumnBaseWidths<T>(
  columns: TableColumn<T>[],
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
    if (col.sortable !== false) {
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

    // 自然な最小幅（見出しラベル幅・ソートアイコン・余白、または明示的minWidth）/ maxWidth ガード
    const naturalMinPx = calculateHeaderMinWidth(col, opt)
    const maxPx = parsePixelWidth(col.maxWidth)

    calculatedPx = Math.max(calculatedPx, naturalMinPx)

    // 備考欄や flexWeight > 1 が指定されたカラムの場合、
    // 空欄初期状態でも入力エリアとしての十分な基準必要幅（最低 200px、または見出し * weight）を確保
    const flexWeight = getColumnFlexWeight(col)

    if (flexWeight > 1) {
      calculatedPx = Math.max(calculatedPx, naturalMinPx * flexWeight, 200)
    }

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
export function distributeColumnWidths<T = Record<string, unknown>>(
  columns: TableColumn<T>[],
  baseWidths: Record<string, number>,
  containerWidth: number,
  options: ColumnWidthCalculationOptions = {},
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
      const colMap = new Map<string, TableColumn<T>>()

      for (const col of columns) {
        colMap.set(String(col.key), col)
      }

      for (const key of flexCols) {
        currentWidths[key] = baseWidths[key] ?? 80
      }

      // 上限（maxWidth）に達していない列を特定しながら、余剰幅を段階配分（ウェイト比例）
      let activeCols = [...flexCols]

      while (remainingExtra > 0 && activeCols.length > 0) {
        const totalWeight = activeCols.reduce(
          (sum, key) => sum + getColumnFlexWeight(colMap.get(key)),
          0,
        )
        const unitShare = Math.floor(remainingExtra / totalWeight)

        if (unitShare === 0) {
          // 残りが totalWeight より小さい端数の場合
          // ウェイトの大きい列（備考欄等）を優先してスロットを展開し1pxずつ配分
          const slots: string[] = []
          const sortedCols = [...activeCols].sort((a, b) => {
            return getColumnFlexWeight(colMap.get(b)) - getColumnFlexWeight(colMap.get(a))
          })

          for (const key of sortedCols) {
            const w = getColumnFlexWeight(colMap.get(key))

            for (let s = 0; s < w; s++) {
              slots.push(key)
            }
          }

          for (let i = 0; i < remainingExtra; i++) {
            const key = slots[i % slots.length]!

            currentWidths[key] = (currentWidths[key] ?? 80) + 1
          }
          break
        }

        let allocatedThisRound = 0
        const nextActiveCols: string[] = []

        for (const key of activeCols) {
          const col = colMap.get(key)
          const weight = getColumnFlexWeight(col)
          const share = unitShare * weight
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
          const uncappedCol = activeCols.find(k => parsePixelWidth(colMap.get(k)?.maxWidth) === undefined)

          if (uncappedCol) {
            currentWidths[uncappedCol] = (currentWidths[uncappedCol] ?? 80) + remainingExtra
          }
          else {
            // 全可変列が上限に達した場合、全列にウェイト比率で均等分配
            const totalColWeight = columns.reduce((sum, c) => sum + getColumnFlexWeight(c), 0)
            const perUnit = Math.floor(remainingExtra / totalColWeight)
            let allocated = 0

            for (let i = 0; i < columns.length; i++) {
              const col = columns[i]!
              const key = String(col.key)
              const weight = getColumnFlexWeight(col)
              const isLast = i === columns.length - 1
              const add = isLast ? (remainingExtra - allocated) : (perUnit * weight)

              allocated += add
              if (flexCols.includes(key)) {
                currentWidths[key] = (currentWidths[key] ?? 80) + add
              }
              else {
                result[key] = (result[key] ?? baseWidths[key] ?? 80) + add
              }
            }
          }
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
  // 可変列（flexCols）をそれぞれの minWidth を下限として比例縮小し、画面幅（containerWidth）にフィット
  const neededShrink = totalBaseWidth - containerWidth
  const colMap = new Map<string, TableColumn<T>>()

  for (const col of columns) {
    colMap.set(String(col.key), col)
  }

  // 固定列はベース幅を維持
  for (const key of fixedCols) {
    result[key] = baseWidths[key] ?? 80
  }

  if (flexCols.length > 0) {
    // 各可変列の縮小可能幅（baseWidth - minWidth）を計算
    const shrinkableWidths: Record<string, number> = {}
    let totalShrinkable = 0

    for (const key of flexCols) {
      const col = colMap.get(key)

      if (!col) continue

      // 自然な最小幅（見出しラベル幅・ソートアイコン・余白、または明示的minWidth）を算出
      const naturalMinPx = calculateHeaderMinWidth(col, options)
      const curPx = baseWidths[key] ?? 80
      const canShrink = Math.max(0, curPx - naturalMinPx)

      shrinkableWidths[key] = canShrink
      totalShrinkable += canShrink
    }

    if (totalShrinkable > 0) {
      const actualShrink = Math.min(neededShrink, totalShrinkable)
      let allocatedShrink = 0

      for (let i = 0; i < flexCols.length; i++) {
        const key = flexCols[i]!
        const canShrink = shrinkableWidths[key] ?? 0
        const isLast = i === flexCols.length - 1
        const shrinkAmount = isLast
          ? (actualShrink - allocatedShrink)
          : Math.floor(actualShrink * (canShrink / totalShrinkable))

        allocatedShrink += shrinkAmount
        result[key] = (baseWidths[key] ?? 80) - shrinkAmount
      }
    }
    else {
      // 縮小余地がない場合は baseWidths を維持
      for (const key of flexCols) {
        result[key] = baseWidths[key] ?? 80
      }
    }
  }

  return result
}

/**
 * セル（td要素）内のコンテンツ（ボタンUIやカスタムスロット要素など）の
 * 「折り返さずに自然に収まる最小必要幅（Intrinsic Width）」を実測する
 */
export function measureCellIntrinsicWidth(td: HTMLElement): number {
  if (!td) return 0

  let maxRowContentWidth = 0
  const children = Array.from(td.children) as HTMLElement[]

  if (children.length === 0) {
    // 子要素（カスタムUI）がないプレーンテキストセルは文字数ベース計算に任せる
    return 0
  }

  // 2段組セル（stacked-cell）や単なるテキスト表示ラッパーは文字数ベース計算に任せる
  const hasOnlyTextContainers = children.every(c =>
    c.classList.contains('stacked-cell')
    || c.classList.contains('cell-text')
    || c.classList.contains('circuit-meisho')
    || c.classList.contains('main-text'),
  )

  if (hasOnlyTextContainers) {
    return 0
  }

  for (const child of children) {
    let width = 0
    const subChildren = Array.from(child.children) as HTMLElement[]

    if (subChildren.length > 0) {
      let isRowLayout = true
      let gap = 0

      if (typeof window !== 'undefined' && window.getComputedStyle) {
        const computed = window.getComputedStyle(child)
        const isFlex = computed.display.includes('flex')
        const isColumn = computed.flexDirection.includes('column')

        isRowLayout = !isFlex || !isColumn
        gap = Number.parseFloat(computed.gap || computed.columnGap || '0') || 0
      }

      if (isRowLayout) {
        // 横並び（ボタン群など）：各要素の幅の合計＋gap
        let totalRowWidth = 0

        for (const sub of subChildren) {
          const rect = sub.getBoundingClientRect()

          totalRowWidth += rect.width || sub.offsetWidth || 0
        }
        if (subChildren.length > 1) {
          totalRowWidth += gap * (subChildren.length - 1)
        }
        width = Math.ceil(totalRowWidth)
      }
      else {
        // 縦並び（バッジと日時など）：各要素の中での最大幅
        let maxSubWidth = 0

        for (const sub of subChildren) {
          const rect = sub.getBoundingClientRect()

          maxSubWidth = Math.max(maxSubWidth, rect.width || sub.offsetWidth || 0)
        }
        width = Math.ceil(maxSubWidth)
      }
    }
    else {
      // 単一要素（単一ボタンや単一バッジ）
      // block要素（divなど）の場合は親幅いっぱいに広がるため除外
      let isBlock = false

      if (typeof window !== 'undefined' && window.getComputedStyle) {
        const comp = window.getComputedStyle(child)

        isBlock = comp.display === 'block'
      }

      if (!isBlock) {
        const rect = child.getBoundingClientRect()

        width = Math.ceil(rect.width || child.offsetWidth || 0)
      }
    }

    maxRowContentWidth = Math.max(maxRowContentWidth, width)
  }

  if (maxRowContentWidth === 0) return 0

  // セル左右のパディングを加算
  let padLeft = 8
  let padRight = 8

  if (typeof window !== 'undefined' && window.getComputedStyle) {
    const tdStyle = window.getComputedStyle(td)

    padLeft = Number.parseFloat(tdStyle.paddingLeft || '8') || 8
    padRight = Number.parseFloat(tdStyle.paddingRight || '8') || 8
  }

  return Math.ceil(maxRowContentWidth + padLeft + padRight)
}

/**
 * テーブル要素から、各列のセルコンテンツの実測最小必要幅をサンプリング計測する
 */
export function measureTableContentWidths<T = Record<string, unknown>>(
  tableEl: HTMLElement,
  columns: TableColumn<T>[],
  maxSampleRows = 5,
): Record<string, number> {
  const result: Record<string, number> = {}

  if (!tableEl || !columns.length) return result

  const rows = tableEl.querySelectorAll('tbody tr')

  if (rows.length === 0) return result

  const sampleCount = Math.min(rows.length, maxSampleRows)

  for (let r = 0; r < sampleCount; r++) {
    const row = rows[r]!
    const cells = row.querySelectorAll('td')

    cells.forEach((td, colIndex) => {
      const col = columns[colIndex]

      if (!col) return
      const key = String(col.key)

      const measured = measureCellIntrinsicWidth(td as HTMLElement)

      if (measured > 0) {
        result[key] = Math.max(result[key] ?? 0, measured)
      }
    })
  }

  return result
}
