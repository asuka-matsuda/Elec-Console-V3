/**
 * データベース検索・フィルタリング Composable
 *
 * @description 機器・ケーブル規格データベースにおけるフリーワード検索、カナ行絞り込み、カテゴリ選択状態を管理します。
 */

import { computed, ref } from 'vue'

interface FilterOptions<T> {
  data: T[]
  searchMapper: (item: T) => string
  categoryMapper?: (item: T) => string
}

export function useDbFilter<T extends Record<string, unknown>>(
  options: FilterOptions<T>,
) {
  const { data, searchMapper } = options
  const categoryMapper
    = options.categoryMapper || ((item: T) => item.category as string)

  const searchQuery = ref('')
  const activeCats = ref<string[]>([])

  const categoryOptions = computed(() => {
    const cats = data.map(item => categoryMapper(item)).filter(Boolean)

    return Array.from(new Set(cats)).map(cat => ({
      label: cat,
      value: cat,
    }))
  })

  const filteredData = computed(() => {
    let result = [...data]

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase().trim()

      result = result.filter((item) => {
        const searchStr = searchMapper(item).normalize('NFKC').toLowerCase()

        return searchStr.includes(q)
      })
    }

    if (activeCats.value.length > 0) {
      result = result.filter(item =>
        activeCats.value.includes(categoryMapper(item)),
      )
    }

    return result
  })

  return {
    searchQuery,
    activeCats,
    categoryOptions,
    filteredData,
  }
}
