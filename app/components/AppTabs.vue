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
  @include flex-start-center;

  flex-wrap: wrap;
  gap: var(--space-2);

  &--grid {
    @include grid(repeat(auto-fit, minmax(120px, 1fr)), var(--space-2));

    .c-tabs__item {
      width: 100%;
      padding-right: 0;
      padding-left: 0;
    }
  }

  &--vertical {
    @include flex-start-stretch($direction: column);

    align-items: stretch;

    .c-tabs__item {
      justify-content: flex-start;
      width: 100%;
    }
  }
}

.c-tabs__item {
  @include click-enabled;
  @include text-desc("md", "medium");
  @include flex-center-center;

  position: relative;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  color: var(--color-text-secondary);

  @include border-base;
  @include state-base(
    inset 0 0 var(--blur-sm) var(--color-border),
    var(--transition-fast)
  );

  &:is(:hover, :focus-visible):not(.is-disabled, .is-active) {
    transform: translateY(-2px);
    color: var(--color-text-main);

    @include state-hover;
  }

  &:active:not(.is-disabled) {
    @include state-active(var(--theme-accent));
  }

  &.is-active {
    --glow-color: var(--theme-accent);

    transform: translateY(0);
    border-color: var(--theme-accent);
    color: var(--theme-accent);

    @include state-active(var(--theme-accent));

    .c-tabs__item-text {
      @include cyber-text-glow;
    }
  }

  &.is-disabled {
    @include disabled;
  }
}

.c-tabs__item-text {
  position: relative;
  z-index: 1;
}
</style>
