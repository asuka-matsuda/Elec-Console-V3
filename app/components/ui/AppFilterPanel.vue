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
    <div class="c-filter-panel__stack">
    <div class="c-filter-panel__header-wrapper">
      <div class="c-filter-panel__header">
        <AppIcon name="search" />
        <span>絞り込み・検索</span>
      </div>
      <AppDivider type="fade-center" variant="border" />
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
  </div></AppPanel>
</template>

<style scoped lang="scss">
.c-filter-panel {
  &__stack {
    @include flex-column(var(--pad-container));
  }

  // --- 子要素 ---
  &__header {
    // --- 継承 ---
    @extend %text-title-sm;

    // --- レイアウト・配置 ---
    @include flex-start;

    // --- ボックスモデル ---
    padding-bottom: var(--gap-element);

    // --- タイポグラフィ ---
    color: var(--color-text-muted);
  }

  &__header-wrapper {
    // --- レイアウト・配置 ---
    @include flex-column;

    // --- ボックスモデル ---
    margin-bottom: var(--pad-container);
  }

  &__filters {
    // --- レイアウト・配置 ---
    @include grid(280px 1fr, var(--gap-section));

    /* スマホ時は縦積み */
    @include mq("md") {
      // --- レイアウト・配置 ---
      grid-template-columns: 1fr;
    }
  }

  &__grid {
    // --- レイアウト・配置 ---
    @include grid-auto(112px);
  }
}
</style>
