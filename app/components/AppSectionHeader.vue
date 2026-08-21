<script setup lang="ts">
/**
 * AppSectionHeader
 * セクションのタイトル、アイコン、アクションボタン、および区切り線を表示するヘッダーコンポーネント。
 */
import type { MenuSection } from "~/utils/data/menuData";

withDefaults(
  defineProps<{
    title?: string;
    icon?: string;
    variant?: MenuSection["accent"];
    size?: "md" | "lg";
    dividerType?: "default" | "fade-side" | "fade-center";
  }>(),
  {
    variant: "main",
    size: "lg",
    dividerType: "default",
  },
);
</script>

<template>
  <header class="c-section-header" :class="[`is-fade-${dividerType}`]">
    <div class="c-section-header__top">
      <h2
        class="c-section-header__title"
        :class="[`c-section-header__title--${size}`]"
        :style="`--section-color: var(--color-category-${variant})`"
      >
        <AppIcon v-if="icon" :name="icon" class="c-section-header__icon" />
        <slot>{{ title }}</slot>
      </h2>
      <div v-if="$slots.actions" class="c-section-header__actions">
        <slot name="actions" />
      </div>
    </div>
    <AppDivider v-if="dividerType === 'default'" :variant="variant" />
  </header>
</template>

<style scoped lang="scss">
.c-section-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  // --- Base Styles ---
  &.is-fade-side {
    @include border-fade(bottom, var(--color-border), 'side');
  }

  &.is-fade-center {
    @include border-fade(bottom, var(--color-border), 'center');
  }

  &__top {
    display: flex;
    gap: var(--space-4);
    align-items: flex-end;
    justify-content: space-between;

    width: 100%;
  }

  &__actions {
    @include flex-start(var(--space-2));
  }

  &__title {
    @include flex-start(var(--gap-component));

    margin: 0;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);

    // --- Size Modifiers ---
    &--lg {
      @extend %text-xl;
    }

    &--md {
      @extend %text-lg;
    }
  }

  &__icon {
    color: var(--section-color);
  }
}
</style>
