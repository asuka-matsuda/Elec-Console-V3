<script setup lang="ts">
/**
 * AppTabs
 * タブ切り替えのためのコンポーネントです。垂直方向の配置やグリッド配置にも対応しています。
 */
export type TabOption = {
  label: string;
  value: string | number;
  disabled?: boolean;
};

const model = defineModel<string | number>();

withDefaults(
  defineProps<{
    options: TabOption[];
    vertical?: boolean;
    grid?: boolean;
  }>(),
  {
    vertical: false,
    grid: false,
  },
);

const selectTab = (option: TabOption) => {
  if (option.disabled) return;
  model.value = option.value;
};
</script>

<template>
  <div
    class="c-tabs"
    :class="{
      'c-tabs--vertical': vertical,
      'c-tabs--grid': grid,
    }"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      class="c-tabs__item"
      :class="{
        'is-active': model === option.value,
        'is-disabled': option.disabled,
      }"
      :disabled="option.disabled"
      @click="selectTab(option)"
    >
      <span class="c-tabs__item-text">{{ option.label }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.c-tabs {
  // --- レイアウト・配置 ---
  @include flex-start(var(--gap-component));

  flex-wrap: wrap;

  // --- モディファイア ---
  &--grid {
    // --- レイアウト・配置 ---
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));


    // --- 子要素 ---

    .c-tabs__item {
      // --- ボックスモデル ---
      width: 100%;
      padding-right: 0;
      padding-left: 0;
    }
  }

  &--vertical {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-component));

    align-items: stretch;


    // --- 子要素 ---

    .c-tabs__item {
      // --- レイアウト・配置 ---
      justify-content: flex-start;

      // --- ボックスモデル ---
      width: 100%;
    }
  }
}

.c-tabs__item {
  // --- 継承 ---
  @extend %text-sm;


  // --- その他 ---

  cursor: pointer;
  user-select: none;


  // --- レイアウト・配置 ---

  position: relative;


  // --- ボックスモデル ---

  padding: var(--pad-container);
  border: var(--border-width-base) solid var(--color-border);


  // --- タイポグラフィ ---

  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);


  // --- 視覚効果 ---

  @include state-base(inset 0 0 var(--blur-sm) var(--color-border), var(--transition-fast));

  // --- 疑似クラス ---
  &:hover:not(.is-disabled, .is-active) {
    // --- 視覚効果 ---
    transform: translateY(-2px);

    // --- タイポグラフィ ---
    color: var(--color-text-main);

    @include state-hover;
  }

  // --- モディファイア ---
  &.is-active {
    // --- 視覚効果 ---
    transform: translateY(0);

    // --- タイポグラフィ ---
    color: var(--color-category-main);

    @include state-active(var(--color-category-main));


    // --- 子要素 ---

    .c-tabs__item-text {
      // --- 視覚効果 ---
      @include cyber-text-glow;
    }
  }

  &.is-disabled {
    // --- 継承 ---
    @extend %disabled;
  }


  // --- レイアウト・配置 ---

  @include flex-center(var(--gap-component));
}

.c-tabs__item-text {
  // --- レイアウト・配置 ---
  position: relative;
  z-index: 1;
}
</style>
