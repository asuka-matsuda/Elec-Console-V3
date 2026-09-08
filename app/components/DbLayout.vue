<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * DbLayout
 * 規格データベースページの共通レイアウトです。検索・フィルタリングパネルとテーブル表示の枠組みを提供します。
 */
import { useDbFilter } from '~/composables/useDbFilter'
import { useTableSort } from '~/composables/useTableSort'
import type { TableColumn } from '~/types/components'

const props = defineProps<{
  data: T[]
  columns: TableColumn<T>[]
  searchMapper: (item: T) => string
  placeholder?: string
}>()

const { searchQuery, activeCats, categoryOptions, filteredData } = useDbFilter({
  data: props.data,
  searchMapper: props.searchMapper,
})

const { sortBy, sortOrder, sortedData, handleSort }
  = useTableSort(filteredData)
</script>

<template>
  <div class="db-layout">
    <aside class="db-layout__filter">
      <slot
        name="filter"
        :search-query="searchQuery"
        :active-cats="activeCats"
        :category-options="categoryOptions"
      >
        <AppFilterPanel
          v-model:search-query="searchQuery"
          v-model:active-cats="activeCats"
          :category-options="categoryOptions"
          :placeholder="placeholder"
        />
      </slot>
    </aside>

    <div class="db-layout__main">
      <slot
        :sorted-data="sortedData"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :handle-sort="handleSort"
      >
        <AppTable
          v-if="sortedData.length > 0"
          :columns="columns"
          :data="sortedData"
          :sort-by="sortBy"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <!-- Pass through all slots for custom cells -->
          <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
          </template>
        </AppTable>

        <MoleculesEmptyState
          v-else
          icon="search"
          title="条件に一致するデータが見つかりません"
          description="検索キーワードまたはカテゴリーフィルターの条件を変更してください。"
        />
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.db-layout {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-card-gap);

  max-width: 1400px;
  min-height: 0;

  &__filter {
    flex-shrink: 0;
  }

  &__main {
    display: flex;
    flex: 1;
    flex-direction: column;

    min-width: 0;
    min-height: 0;
  }
}
</style>
