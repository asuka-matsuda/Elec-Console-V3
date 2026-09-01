<script setup lang="ts" generic="T extends Record<string, unknown>
">
/**
 * DbViewer
 * データベースのビューアコンポーネントです。検索やフィルタリング機能を提供し、結果をテーブルで表示します。
 */
import type { TableColumn } from '~/components/AppTable.vue'
import { useDbFilter } from '~/composables/useDbFilter'

const props = defineProps<{
  data: T[]
  columns: TableColumn[]
  searchMapper: (item: T) => string
  placeholder?: string
}>()

const { searchQuery, activeCats, categoryOptions, filteredData } = useDbFilter({
  data: props.data,
  searchMapper: props.searchMapper,
})

const { sortBy, sortOrder, sortedData, handleSort } = useTableSort(filteredData)
</script>

<template>
  <div class="c-db">
    <div class="l-filter-layout">
      <div class="l-filter-layout__grid">
        <aside class="l-filter-layout__sidebar">
          <AppFilterPanel
            v-model:search-query="searchQuery"
            v-model:active-cats="activeCats"
            :category-options="categoryOptions"
            :placeholder="placeholder"
          />
        </aside>

        <main class="l-filter-layout__main">
          <AppPanel
            v-if="sortedData.length > 0"
            class="c-db-panel"
          >
            <AppTable
              :columns="columns"
              :data="sortedData"
              :sort-by="sortBy"
              :sort-order="sortOrder"
              @sort="handleSort"
            >
              <!-- Pass through all slots for custom cells -->
              <template
                v-for="(_, name) in $slots"
                #[name]="slotProps"
              >
                <slot
                  :name="name"
                  v-bind="slotProps"
                />
              </template>
            </AppTable>
          </AppPanel>

          <AppEmptyState
            v-else
            icon="search"
            title="条件に一致するデータが見つかりません"
            description="検索キーワードまたはカテゴリーフィルターの条件を変更してください。"
          />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.l-filter-layout {
  container-name: filter-layout;
  container-type: inline-size;

  @include flex-start-stretch($direction: column);

  flex: 1;

  width: 100%;
  max-width: 1400px;
  min-height: 0;

  &__grid {
    @include flex-start-stretch($direction: column);

    flex: 1;
    gap: var(--space-card-gap);
    min-height: 0;
  }

  &__sidebar {
    width: 100%;
  }

  &__main {
    @include flex-start-stretch($direction: column);

    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}

.c-db {
  @include flex-start-stretch($direction: column);

  flex: 1;
  min-height: 0;
}

.c-db-panel {
  overflow: hidden;

  @include flex-start-stretch($direction: column);

  flex: 1;
  min-height: 0;
}
</style>
