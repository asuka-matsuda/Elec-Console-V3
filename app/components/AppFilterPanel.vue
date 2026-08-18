<script setup lang="ts">
/**
 * AppFilterPanel
 *
 * データベース画面や一覧画面用の検索・カテゴリ絞り込みパネルを提供します。
 */

interface CategoryOption {
  label: string;
  value: string;
}

const searchQuery = defineModel<string>("searchQuery", { default: "" });
const activeCats = defineModel<string[]>("activeCats", { default: () => [] });

defineProps<{
  /** 検索プレースホルダー */
  placeholder?: string;
  /** カテゴリ選択肢の配列 */
  categoryOptions: CategoryOption[];
}>();

const toggleCat = (value: string) => {
  if (activeCats.value.includes(value)) {
    activeCats.value = activeCats.value.filter((c) => c !== value);
  } else {
    activeCats.value = [...activeCats.value, value];
  }
};
</script>

<template>
  <AppPanel>
    <div class="c-filter-panel__header">
      <AppIcon name="search" />
      <span>絞り込み・検索</span>
    </div>

    <div class="c-filter-panel__filters">
      <AppFormGroup label="Keyword">
        <AppInput v-model="searchQuery" :placeholder="placeholder" />
      </AppFormGroup>

      <AppFormGroup v-if="categoryOptions.length > 0" label="Category">
        <div class="c-filter-panel__grid">
          <AppCheckbox
            v-for="cat in categoryOptions"
            :key="cat.value"
            :model-value="activeCats.includes(cat.value)"
            @update:model-value="toggleCat(cat.value)"
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

<style scoped lang="scss">
.c-filter-panel {
  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-base);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);

    @include ui-border-fade(bottom, var(--color-border));

    padding-bottom: var(--space-2);
  }

  &__filters {
    display: grid;
    grid-template-columns: 280px 1fr; /* PC時は横並び（キーワード入力幅を固定、残りをカテゴリに） */
    gap: var(--space-5);

    /* スマホ時は縦積み */
    @include mq("md") {
      grid-template-columns: 1fr;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
    gap: var(--space-3);
  }
}
</style>
