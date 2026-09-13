/**
 * useTableAutoWidth.ts
 * テーブルコンテナ要素の幅を監視し、カラム定義とデータセットに基づいて
 * 動的な列幅の自動配分スタイル（columnWidthStyles）を提供するComposable。
 */
import { useElementSize } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, ref, toValue, watchEffect } from 'vue'

import type { TableColumn } from '~/types/components'
import { calculateColumnBaseWidths, distributeColumnWidths } from '~/utils/tableAutoWidth'

export interface UseTableAutoWidthOptions<T> {
  columns: MaybeRefOrGetter<TableColumn<unknown>[]>
  data: MaybeRefOrGetter<T[] | undefined>
  fullData?: MaybeRefOrGetter<T[] | undefined>
  autoWidth?: MaybeRefOrGetter<boolean | undefined>
}

export function useTableAutoWidth<T = unknown>(
  containerRef: MaybeRefOrGetter<HTMLElement | null>,
  options: UseTableAutoWidthOptions<T>,
) {
  // コンテナ要素のリアルタイム幅監視
  const { width: containerWidth } = useElementSize(containerRef)

  // 各カラムの基本必要幅（文字長ベース）のキャッシュ（縮小・ガタつき防止）
  const baseWidthsCache = ref<Record<string, number>>({})

  // fullData があればそれを優先、なければ data からキャッシュを更新
  watchEffect(() => {
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
  })

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
    const distributed = distributeColumnWidths(rawCols, baseWidthsCache.value, cWidth)

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
  }

  return {
    containerWidth,
    baseWidthsCache,
    columnWidthStyles,
    resetCache,
  }
}
