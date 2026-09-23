/**
 * テーブル列幅自動配分 Composable
 *
 * @description テーブルコンテナ要素の幅を監視し、カラム定義とデータセットに基づいて動的な列幅の自動配分スタイルを提供します。
 */
import { useElementSize } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, nextTick, onMounted, ref, toValue, watch } from 'vue'

import type { TableColumn } from '~/types/components'
import {
  calculateColumnBaseWidths,
  distributeColumnWidths,
  measureTableContentWidths,
} from '~/utils/tableAutoWidth'

export interface UseTableAutoWidthOptions<T = Record<string, unknown>> {
  columns: MaybeRefOrGetter<TableColumn<T>[]>
  data: MaybeRefOrGetter<T[] | undefined>
  fullData?: MaybeRefOrGetter<T[] | undefined>
  autoWidth?: MaybeRefOrGetter<boolean | undefined>
}

// データの「件数」および「含まれる行の識別子」からシグネチャを生成
// 行内部のプロパティ（チェックボックスのON/OFF等）の変化ではシグネチャは変化しない
const getDataSignature = (data: unknown[] | undefined): string => {
  if (!data || data.length === 0) return '0:empty'

  const idStr = data.map((row: unknown, i) => {
    if (row && typeof row === 'object') {
      const record = row as Record<string, unknown>

      return String(record.id ?? record.key ?? i)
    }

    return String(i)
  }).join(',')

  return `${data.length}:${idStr}`
}

export function useTableAutoWidth<T = Record<string, unknown>>(
  containerRef: MaybeRefOrGetter<HTMLElement | null>,
  options: UseTableAutoWidthOptions<T>,
) {
  // コンテナ要素のリアルタイム幅監視
  const { width: containerWidth } = useElementSize(containerRef)

  // 各カラムの基本必要幅（文字長ベース）のキャッシュ（縮小・ガタつき防止）
  const baseWidthsCache = ref<Record<string, number>>({})
  // レンダリングされたDOMから実測されたコンテンツ最小幅
  const domMeasuredWidths = ref<Record<string, number>>({})

  // 文字数ベースの基準必要幅を計算
  const updateBaseWidths = () => {
    const rawFull = toValue(options.fullData)
    const rawData = toValue(options.data)
    const rawCols = toValue(options.columns)

    const sourceData = (rawFull && rawFull.length > 0) ? rawFull : rawData

    if (rawCols && rawCols.length > 0 && sourceData && sourceData.length > 0) {
      baseWidthsCache.value = calculateColumnBaseWidths(
        rawCols,
        sourceData,
        baseWidthsCache.value,
      )
    }
  }

  // DOM の描画後に各セルの実寸（ボタンUIなどの実測幅）をサンプリング計測して最小下限（minWidth）を補正
  const measureAndUpdateFromDom = () => {
    if (typeof window === 'undefined') return
    const wrapper = toValue(containerRef)

    if (!wrapper) return
    const table = wrapper.querySelector('table')

    if (!table) return

    const rawCols = toValue(options.columns) || []

    if (rawCols.length === 0) return

    const measured = measureTableContentWidths(table, rawCols)
    let hasChanges = false
    const currentDom = { ...domMeasuredWidths.value }

    for (const [key, w] of Object.entries(measured)) {
      if (w <= 0) continue

      // 異常な巨大幅（コンテナ幅の半分を超えるなど）を防ぐガード
      const safeMeasured = Math.min(w, Math.max(300, (containerWidth.value || 1000) * 0.45))

      // DOM実測値は domMeasuredWidths（最小下限値）にのみ反映し、
      // 文字数基準幅 baseWidthsCache には混入させない（肥大化ループの防止）
      if (safeMeasured !== (currentDom[key] ?? 0)) {
        currentDom[key] = safeMeasured
        hasChanges = true
      }
    }

    if (hasChanges) {
      domMeasuredWidths.value = currentDom
    }
  }

  // クライアント側での初回マウント時：基準幅の計算とDOM計測を実行
  onMounted(() => {
    updateBaseWidths()
    nextTick(measureAndUpdateFromDom)
  })

  // 「データ件数・行構成の変化（初回ロードやフィルター時）」および「カラム定義の変化」のみを監視
  // ※ 行内部のプロパティ（チェックボックスのON/OFF等）の変更では再計算は発火しない
  watch(
    [
      () => getDataSignature(toValue(options.data)),
      () => getDataSignature(toValue(options.fullData)),
      () => toValue(options.columns),
    ],
    () => {
      updateBaseWidths()
      nextTick(measureAndUpdateFromDom)
    },
  )

  // コンテナ幅およびキャッシュ幅をもとに、各列の最終幅スタイルを算出
  const columnWidthStyles = computed<Record<string, string>>(() => {
    const isAuto = toValue(options.autoWidth) !== false
    const rawCols = toValue(options.columns) || []

    if (!isAuto) {
      const res: Record<string, string> = {}

      for (const col of rawCols) {
        if (col.width) res[String(col.key)] = col.width
      }

      return res
    }

    const cWidth = containerWidth.value
    const distributed = distributeColumnWidths(
      rawCols,
      baseWidthsCache.value,
      cWidth,
      { measuredMinWidths: domMeasuredWidths.value },
    )

    const res: Record<string, string> = {}

    for (const col of rawCols) {
      const key = String(col.key)
      const px = distributed[key]

      res[key] = px !== undefined ? `${px}px` : (col.width || 'auto')
    }

    return res
  })

  const resetCache = () => {
    baseWidthsCache.value = {}
    domMeasuredWidths.value = {}
  }

  return {
    containerWidth,
    baseWidthsCache,
    domMeasuredWidths,
    columnWidthStyles,
    resetCache,
    measureAndUpdateFromDom,
  }
}
