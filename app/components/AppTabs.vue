<script setup lang="ts">
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
    role="tablist"
    :aria-orientation="vertical ? 'vertical' : 'horizontal'"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      class="c-tabs__item"
      :class="{
        'is-active': model === option.value,
        'is-disabled': option.disabled,
      }"
      role="tab"
      :aria-selected="model === option.value"
      :aria-disabled="option.disabled"
      :disabled="option.disabled"
      @click="selectTab(option)"
    >
      <span class="c-tabs__item-text">{{ option.label }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.c-tabs {
  @include flex-start(var(--gap-component));
  flex-wrap: wrap;

  /* --- Modifiers --- */
  &--grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));

    .c-tabs__item {
      width: 100%;
      padding-right: 0;
      padding-left: 0;
    }
  }

  &--vertical {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-2);

    .c-tabs__item {
      justify-content: flex-start;
      width: 100%;
    }
  }
}

.c-tabs__item {
  position: relative;
  @include flex-center(var(--space-2));
  padding: var(--pad-container);

  @extend %text-sm;

  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  border: var(--border-width-base) solid var(--color-border);
  box-shadow: inset 0 0 var(--blur-sm) var(--color-border);
  cursor: pointer;
  user-select: none;
  transition: var(--transition-base);

  /* --- Hover State --- */
  &:hover:not(.is-disabled, .is-active) {
    color: var(--color-text-main);

    @include ui-hover-glow;

    transform: translateY(-2px);
  }

  /* --- Active State --- */
  &.is-active {
    color: var(--color-category-main);

    @include ui-active(var(--color-category-main));

    transform: translateY(0);

    .c-tabs__item-text {
      @include cyber-text-glow(50%, var(--blur-md), var(--color-category-main));
    }
  }

  /* --- Disabled State --- */
  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.c-tabs__item-text {
  position: relative;
  z-index: 1;
}
</style>
