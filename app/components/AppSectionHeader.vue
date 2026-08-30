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
  // --- レイアウト・配置 ---
  @include flex-column;

  // --- 子要素 ---
  &__top {
    // --- レイアウト・配置 ---
    @include flex-between(var(--space-card-gap));

    align-items: flex-end;

    // --- ボックスモデル ---
    width: 100%;
  }

  &__actions {
    // --- レイアウト・配置 ---
    @include flex-start(var(--space-inline-gap));
  }

  &__title {
    // --- レイアウト・配置 ---
    @include flex-start(var(--space-inline-gap));

    color: var(--color-text-main);

    // --- モディファイア ---
    &--lg {
      // --- 継承 ---
      @include text-title-lg;
    }

    &--md {
      // --- 継承 ---
      @include text-title-md;
    }

    &--sm {
      // --- 継承 ---
      @include text-title-sm;
    }
  }

  &__icon {
    // --- タイポグラフィ ---
    color: var(--section-color);
  }

  &__desc {
    // --- 継承 ---
    @include text-desc;
  }
}
</style>
