import { computed, type ComputedRef, isRef, type Ref, ref } from 'vue'

export type SortOrder = 'asc' | 'desc'

export interface UseTableSortOptions<T> {
  defaultKey?: (keyof T & string) | string
  defaultOrder?: SortOrder
}

/**
 * テーブルの並び替え（ソート）状態とロジックを管理する共通Composable
 * 文字列、数値、日付、null/undefined を自動判別してソートします。
 */
export const useTableSort = <T extends Record<string, unknown>>(
  sourceData: Ref<T[]> | ComputedRef<T[]> | T[],
  options: UseTableSortOptions<T> = {},
) => {
  const sortBy = ref<string>(options.defaultKey || '')
  const sortOrder = ref<SortOrder>(options.defaultOrder || 'asc')

  const handleSort = (payload: { key: string, order?: SortOrder }) => {
    if (sortBy.value === payload.key) {
      if (payload.order) {
        sortOrder.value = payload.order
      }
      else {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      }
    }
    else {
      sortBy.value = payload.key
      sortOrder.value = payload.order || 'asc'
    }
  }

  const resetSort = () => {
    sortBy.value = options.defaultKey || ''
    sortOrder.value = options.defaultOrder || 'asc'
  }

  const sortedData = computed<T[]>(() => {
    const list = isRef(sourceData) ? sourceData.value : sourceData

    if (!list || !Array.isArray(list)) return []
    if (!sortBy.value) return list

    const key = sortBy.value
    const orderMultiplier = sortOrder.value === 'asc' ? 1 : -1

    return [...list].sort((a, b) => {
      const valA = a[key]
      const valB = b[key]

      // 1. null / undefined のハンドリング（常に末尾に寄せる）
      if (valA == null && valB == null) return 0
      if (valA == null) return 1
      if (valB == null) return -1

      // 2. 数値比較
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * orderMultiplier
      }

      // 数値文字列の比較（例: "100" vs "20"）
      const numA = Number(valA)
      const numB = Number(valB)

      if (
        !isNaN(numA)
        && !isNaN(numB)
        && typeof valA !== 'boolean'
        && typeof valB !== 'boolean'
        && String(valA).trim() !== ''
        && String(valB).trim() !== ''
      ) {
        return (numA - numB) * orderMultiplier
      }

      // 3. 日付比較
      const dateA
        = valA instanceof Date
          ? valA.getTime()
          : typeof valA === 'string'
            && !isNaN(Date.parse(valA))
            && valA.includes('-')
            ? Date.parse(valA)
            : NaN
      const dateB
        = valB instanceof Date
          ? valB.getTime()
          : typeof valB === 'string'
            && !isNaN(Date.parse(valB))
            && valB.includes('-')
            ? Date.parse(valB)
            : NaN

      if (!isNaN(dateA) && !isNaN(dateB)) {
        return (dateA - dateB) * orderMultiplier
      }

      // 4. 文字列比較 (日本語五十音・英数対応)
      return String(valA).localeCompare(String(valB), 'ja') * orderMultiplier
    })
  })

  return {
    sortBy,
    sortOrder,
    sortedData,
    handleSort,
    resetSort,
  }
}
