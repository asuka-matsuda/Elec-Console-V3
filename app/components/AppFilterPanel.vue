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

interface Props {
  title?: string
  icon?: string
  placeholder?: string
  categoryOptions?: CategoryOption[]
}

const searchQuery = defineModel<string>('searchQuery', { default: '' })

const activeCats = defineModel<string[]>('activeCats', { default: () => [] })

const {
  title = '絞り込み・検索',
  icon = 'search',
  placeholder,
  categoryOptions = [],
} = defineProps<Props>()
</script>

<template>
  <AppPanel>
    <template #header>
      <slot name="header">
        <AppSectionHeader :title="title" :icon="icon" />
      </slot>
    </template>

    <div class="filters">
      <AppFormGroup label="Keyword">
        <AppInput v-model="searchQuery" :placeholder="placeholder" />
      </AppFormGroup>

      <AppFormGroup v-if="categoryOptions.length > 0" label="Category">
        <div class="category-grid">
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
.filters {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-form-row-gap);

  & > :nth-child(n + 3) {
    grid-column: 1 / -1;
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--space-2);
}
</style>
