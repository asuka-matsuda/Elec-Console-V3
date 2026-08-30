<script setup lang="ts">
/**
 * AppSectionHeader
 * セクションのタイトル、アイコン、アクションボタン、および区切り線を表示するヘッダーコンポーネント。
 */
import type { MenuSection } from "~/constants/data/menuData";

withDefaults(
  defineProps<{
    title?: string;
    titleId?: string;
    tag?: string;
    icon?: string;
    variant?: MenuSection["accent"];
    size?: "sm" | "md" | "lg";
    dividerType?: "default" | "fade-side" | "fade-center";
  }>(),
  {
    tag: "h2",
    variant: "main",
    size: "lg",
    dividerType: "default",
  },
);
</script>

<template>
  <header class="c-section-header">
    <div class="c-section-header__top">
      <component
        :is="tag"
        :id="titleId"
        class="c-section-header__title"
        :class="[`c-section-header__title--${size}`]"
        :style="`--section-color: var(--color-category-${variant})`"
      >
        <AppIcon
          v-if="icon"
          :name="icon"
          class="c-section-header__icon"
        />
        <slot>{{ title }}</slot>
      </component>
      <div
        v-if="$slots.actions"
        class="c-section-header__actions"
      >
        <slot name="actions" />
      </div>
    </div>
    <div
      v-if="$slots.description"
      class="c-section-header__desc"
    >
      <slot name="description" />
    </div>
    <AppDivider
      :variant="dividerType === 'default' ? variant : 'border'"
      :type="dividerType === 'default' ? 'solid' : dividerType"
    />
  </header>
</template>

<style scoped lang="scss">
.c-section-header {
  @include flex-column;

  &__top {
    @include flex-between(var(--space-card-gap));

    align-items: flex-end;
    width: 100%;
  }

  &__actions {
    @include flex-start(var(--space-inline-gap));
  }

  &__title {
    @include flex-start(var(--space-inline-gap));

    color: var(--color-text-main);

    &--lg {
      @include text-title-lg;
    }

    &--md {
      @include text-title-md;
    }

    &--sm {
      @include text-title-sm;
    }
  }

  &__icon {
    color: var(--section-color);
  }

  &__desc {
    @include text-desc;
  }
}
</style>
