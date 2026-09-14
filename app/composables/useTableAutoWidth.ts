/**
 * useTableAutoWidth.ts
 * テーブルコンテナ要素の幅を監視し、カラム定義とデータセットに基づいて
 * 動的な列幅の自動配分スタイル（columnWidthStyles）を提供するComposable。
 * テキスト文字数からの自動推測に加え、レンダリングされたDOM（ボタンUI等のスロット）の
 * 実測最小幅（Intrinsic Content Width）を自動サンプリングして完全自律配分します。
 */
import { useElementSize, useMutationObserver } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, nextTick, onMounted, ref, toValue, watch, watchEffect } from 'vue'

import type { TableColumn } from '~/types/components'
import {
  calculateColumnBaseWidths,
  distributeColumnWidths,
  measureTableContentWidths,
} from '~/utils/tableAutoWidth'

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
  // レンダリングされたDOMから実測されたコンテンツ最小幅
  const domMeasuredWidths = ref<Record<string, number>>({})

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

  // DOM の描画後に各セルの実寸（ボタンUIなどの実測幅）をサンプリング計測してキャッシュ・最小下限を補正
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
    const currentBase = { ...baseWidthsCache.value }
    const currentDom = { ...domMeasuredWidths.value }

    for (const [key, w] of Object.entries(measured)) {
      // 異常な巨大幅（コンテナ幅の半分を超えるなど）を防ぐガード
      const safeMeasured = Math.min(w, Math.max(300, (containerWidth.value || 1000) * 0.45))

      if (safeMeasured > (currentBase[key] ?? 0)) {
        currentBase[key] = safeMeasured
        hasChanges = true
      }
      if (safeMeasured !== (currentDom[key] ?? 0)) {
        currentDom[key] = safeMeasured
        hasChanges = true
      }
    }

    if (hasChanges) {
      baseWidthsCache.value = currentBase
      domMeasuredWidths.value = currentDom
    }
  }

  // クライアント側でのマウント時・データ更新時に自動計測を実行
  onMounted(() => {
    nextTick(measureAndUpdateFromDom)
  })

  watch(
    [() => toValue(options.data), () => toValue(options.columns)],
    () => {
      nextTick(measureAndUpdateFromDom)
    },
    { deep: true },
  )

  // DOM構造の変更（ボタンの動的追加・編集UI切替等）を自動検知して再計測
  useMutationObserver(
    containerRef,
    () => {
      measureAndUpdateFromDom()
    },
    { childList: true, subtree: false },
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
