<script setup lang="ts">
/**
 * DatabaseDynamicPage
 * 規格データベース画面の統合ページコンポーネント。
 * ルーティングパラメータに基づいて該当するデータベース定義を取得し表示します。
 */
import { useRoute } from 'vue-router'

import { useDbFilter } from '~/composables/useDbFilter'
import { useTableSort } from '~/composables/useTableSort'
import { DATABASE_REGISTRY } from '~/constants/databaseRegistry'

// ルート変更時にコンポーネントを確実に再初期化
definePageMeta({
  key: route => route.fullPath,
})

const route = useRoute()
const dbKey = String(route.params.type)
const currentDb = DATABASE_REGISTRY[dbKey]

if (!currentDb) {
  throw createError({ statusCode: 404, statusMessage: 'データベースが見つかりません', fatal: true })
}

useHead({
  title: currentDb.title,
})

const { searchQuery, activeCats, categoryOptions, filteredData } = useDbFilter({
  data: currentDb.data,
  searchMapper: currentDb.searchMapper,
})

const { sortBy, sortOrder, sortedData } = useTableSort(filteredData)
</script>

<template>
  <div class="flex flex-1 flex-col gap-panel-gap w-full max-w-[1400px] min-h-0 mx-auto">

    <Disclaimer text="注記: 掲載データはJISおよび内線規程等に基づく標準規格値です。選定にあたってはメーカー仕様書も併せてご確認ください。" />

    <FilterPanel
      v-model:search-query="searchQuery"
      v-model:active-cats="activeCats"
      :category-options="categoryOptions"
      :placeholder="currentDb.placeholder"
    />

    <Table
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      :columns="currentDb.columns"
      :data="sortedData"
      empty-text="条件に一致するデータが見つかりません"
      class="flex-1 min-h-0"
    />
  </div>
</template>
