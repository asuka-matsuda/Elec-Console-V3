<script setup lang="ts">
/**
 * AppDbFilterPanel
 * 
 * データベース画面用の検索・カテゴリ絞り込みパネルを提供します。
 */

interface CategoryOption {
  label: string
  value: string
}

defineProps<{
  /** 検索キーワード（v-model） */
  searchQuery: string
  /** 検索プレースホルダー */
  placeholder?: string
  /** カテゴリ選択肢の配列 */
  categoryOptions: CategoryOption[]
  /** 現在選択されているカテゴリの配列 */
  activeCats: string[]
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'toggleCat', value: string): void
}>()
</script>

<template>
  <AppPanel>
    <div class="p-db__filter-header">
      <AppIcon name="search" />
      <span>絞り込み・検索</span>
    </div>

    <div class="p-db__filters">
      <AppFormGroup label="Keyword">
        <AppInput 
          :model-value="searchQuery"
          @update:model-value="emit('update:searchQuery', $event)"
          :placeholder="placeholder" 
        />
      </AppFormGroup>

      <AppFormGroup v-if="categoryOptions.length > 0" label="Category">
        <div class="p-db__filter-grid">
          <AppCheckbox
            v-for="cat in categoryOptions"
            :key="cat.value"
            :model-value="activeCats.includes(cat.value)"
            @update:model-value="emit('toggleCat', cat.value)"
          >
            {{ cat.label }}
          </AppCheckbox>
        </div>
      </AppFormGroup>
      
      <!-- スロットを追加して、特有のフィルター（五十音など）を拡張可能にする -->
      <slot name="extra-filters" />
    </div>
  </AppPanel>
</template>
