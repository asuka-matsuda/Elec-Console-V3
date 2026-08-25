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
  <header class="c-section-header">
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
    display: flex;
    gap: var(--pad-container);
    align-items: flex-end;
    justify-content: space-between;

    // --- ボックスモデル ---
    width: 100%;
  }

  &__actions {
    // --- レイアウト・配置 ---
    @include flex-start(var(--gap-component));
  }

  &__title {
    // --- レイアウト・配置 ---
    @include flex-start(var(--gap-component));

    color: var(--color-text-main);

    // --- モディファイア ---
    &--lg {
      // --- 継承 ---
      @extend %text-title-lg;
    }

    &--md {
      // --- 継承 ---
      @extend %text-title-md;
    }
  }

  &__icon {
    // --- タイポグラフィ ---
    color: var(--section-color);
  }
}
</style>
