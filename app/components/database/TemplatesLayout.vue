<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * TemplatesLayout
 * [Db Template] 規格データベースページの全体テンプレートコンポーネント。
 * 検索・フィルタリングパネルとテーブル表示の枠組みを提供します。
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
  <div class="flex flex-1 flex-col gap-panel-gap w-full max-w-[1400px] min-h-0 mx-auto">
    <aside class="shrink-0">
      <slot
        name="filter"
        :search-query="searchQuery"
        :active-cats="activeCats"
        :category-options="categoryOptions"
      >
        <OrganismsFilterPanel
          v-model:search-query="searchQuery"
          v-model:active-cats="activeCats"
          :category-options="categoryOptions"
          :placeholder="placeholder"
        />
      </slot>
    </aside>

    <div class="flex flex-1 flex-col min-w-0 min-h-0">
      <slot
        :sorted-data="sortedData"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :handle-sort="handleSort"
      >
        <MoleculesTable
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
        </MoleculesTable>

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
