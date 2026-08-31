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
        <AppDivider
          type="fade-center"
          variant="border"
        />
      </div>

      <div class="c-filter-panel__filters">
        <AppFormGroup label="Keyword">
          <AppInput
            v-model="searchQuery"
            :placeholder="placeholder"
          />
        </AppFormGroup>

        <AppFormGroup
          v-if="categoryOptions.length > 0"
          label="Category"
        >
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
    </div>
  </AppPanel>
</template>

<style scoped lang="scss">
.c-filter-panel {
  &__stack {
    @include flex-column(var(--space-card-gap));
  }

  &__header {
    @include text-title("sm");
    @include flex-start;

    padding-bottom: var(--space-control-py-sm);
    color: var(--color-text-muted);
  }

  &__header-wrapper {
    @include flex-column(var(--space-stack-gap-sm));
  }

  &__filters {
    @include grid(280px 1fr, var(--space-card-gap));

    /* スマホ時は縦積み */
    @include mq("md") {
      grid-template-columns: 1fr;
    }
  }

  &__grid {
    @include grid-auto(112px, var(--space-inline-gap));
  }
}
</style>
