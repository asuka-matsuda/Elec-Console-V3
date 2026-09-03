<script setup lang="ts">
/**
 * AppFilterPanel
 *
 * データベース画面や一覧画面用の検索・カテゴリ絞り込みパネルを提供します。
 */

interface CategoryOption {
  label: string
  value: string
}

const searchQuery = defineModel<string>('searchQuery', { default: '' })
const activeCats = defineModel<string[]>('activeCats', { default: () => [] })

defineProps<{
  placeholder?: string
  categoryOptions: CategoryOption[]
}>()
</script>

<template>
  <AppPanel title="絞り込み・検索" icon="search">
    <div class="c-filter-panel__filters">
      <AppFormGroup label="Keyword">
        <AppInput v-model="searchQuery" :placeholder="placeholder" />
      </AppFormGroup>

      <AppFormGroup v-if="categoryOptions.length > 0" label="Category">
        <div class="c-filter-panel__grid">
          <AppCheckbox
            v-for="cat in categoryOptions"
            :key="cat.value"
            v-model="activeCats"
            :value="cat.value"
          >
            {{ cat.label }}
          </AppCheckbox>
        </div>
      </AppFormGroup>

      <slot name="extra-filters" />
    </div>
  </AppPanel>
</template>

<style scoped lang="scss">
.c-filter-panel {
  &__filters {
    @include grid(1fr, var(--space-card-gap));

    @include cq("sm") {
      grid-template-columns: 1fr;
    }

    & > :nth-child(n + 3) {
      grid-column: 1 / -1;
    }
  }

  &__grid {
    @include grid-auto(100px, var(--space-2));
  }
}
</style>
