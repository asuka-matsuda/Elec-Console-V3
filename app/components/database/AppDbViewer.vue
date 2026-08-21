<script setup lang="ts" generic="T extends Record<string, unknown>">
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
  <div class="p-db">
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
          <AppPanel v-if="filteredData.length > 0" class="p-db__table-panel">
            <AppTable :columns="columns" :data="filteredData">
              <!-- Pass through all slots for custom cells -->
              <template v-for="(_, name) in $slots" #[name]="slotProps">
                <slot :name="name" v-bind="slotProps" />
              </template>
            </AppTable>
          </AppPanel>

          <div v-else class="p-db__empty">
            <p>条件に一致するデータが見つかりません。</p>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.l-filter-layout {
  // --- Base Styles ---
  container-name: filter-layout;
  container-type: inline-size;
  display: flex;
  flex: 1;
  flex-direction: column;

  width: 100%;
  max-width: 1400px;
  min-height: 0;

  &__grid {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--gap-section);

    min-height: 0;
  }

  &__sidebar {
    width: 100%;
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
