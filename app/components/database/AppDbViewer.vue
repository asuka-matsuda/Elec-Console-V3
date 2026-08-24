<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * AppDbViewer
 * データベースのビューアコンポーネントです。検索やフィルタリング機能を提供し、結果をテーブルで表示します。
 */
import { useDbFilter } from "~/composables/useDbFilter";
import type { TableColumn } from "~/components/AppTable.vue";

const props = defineProps<{
  data: T[];
  columns: TableColumn[];
  searchMapper: (item: T) => string;
  placeholder?: string;
}>();

const { searchQuery, activeCats, categoryOptions, filteredData } = useDbFilter({
  data: props.data,
  searchMapper: props.searchMapper,
});
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
          <AppPanel v-if="filteredData.length > 0" class="c-db-panel">
            <AppTable :columns="columns" :data="filteredData">
              <!-- Pass through all slots for custom cells -->
              <template v-for="(_, name) in $slots" #[name]="slotProps">
                <slot :name="name" v-bind="slotProps" />
              </template>
            </AppTable>
          </AppPanel>

          <div v-else class="c-db-empty">
            <p>条件に一致するデータが見つかりません。</p>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.l-filter-layout {
  // --- レイアウト・配置 ---
  container-name: filter-layout;
  container-type: inline-size;

  @include flex-column(0);

  flex: 1;


  // --- ボックスモデル ---

  width: 100%;
  max-width: 1400px;
  min-height: 0;


  // --- 子要素 ---

  &__grid {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-section));

    flex: 1;

    // --- ボックスモデル ---
    min-height: 0;
  }

  &__sidebar {
    // --- ボックスモデル ---
    width: 100%;
  }

  &__main {
    // --- レイアウト・配置 ---
    @include flex-column(0);

    flex: 1;

    // --- ボックスモデル ---
    min-width: 0;
    min-height: 0;
  }
}

.c-db {
  // --- レイアウト・配置 ---
  @include flex-column(0);

  flex: 1;

  // --- ボックスモデル ---
  min-height: 0;
}

.c-db-panel {
  // --- その他 ---
  overflow: hidden;


  // --- レイアウト・配置 ---

  @include flex-column(0);

  flex: 1;

  // --- ボックスモデル ---
  min-height: 0;
}

.c-db-empty {
  // --- 継承 ---
  @extend %text-base;


  // --- ボックスモデル ---

  padding: var(--pad-container);
  border: var(--border-width-base) solid theme-color(var(--color-border), 50%);

  // --- タイポグラフィ ---
  color: var(--color-text-muted);
  text-align: center;
}
</style>
