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
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  max-width: 1400px;
  container-type: inline-size;
  container-name: filter-layout;

  &__grid {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  &__sidebar {
    width: 100%;
  }

  &__main {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
}
</style>
