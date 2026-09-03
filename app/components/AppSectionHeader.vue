<script setup lang="ts">
/**
 * AppSectionHeader
 * セクションのタイトル、アイコン、アクションボタン、および区切り線を表示するヘッダーコンポーネント。
 */
import type { MenuSection } from '~/constants/data/menuData'

withDefaults(
  defineProps<{
    title?: string
    titleId?: string
    tag?: string
    icon?: string
    variant?: MenuSection['accent']
    size?: 'sm' | 'md' | 'lg'
    dividerType?: 'default' | 'fade-side' | 'fade-center'
  }>(),
  {
    tag: 'h2',
    variant: 'main',
    size: 'lg',
    dividerType: 'default',
  },
)
</script>

<template>
  <header class="c-section-header">
    <div class="c-section-header__top">
      <component
        :is="tag"
        :id="titleId"
        class="c-section-header__title"
        :class="[`c-section-header__title--${size}`]"
      >
        <AppIcon v-if="icon" :name="icon" class="c-section-header__icon" />
        <slot>{{ title }}</slot>
      </component>
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
  @include flex-start-stretch($direction: column);

  gap: var(--space-1);

  &__top {
    @include flex-between-end;

    gap: var(--space-card-gap);
  }

  &__actions {
    @include flex-start-center;

    gap: var(--space-2);
  }

  &__title {
    @include flex-start-center;

    gap: var(--space-2);
    color: var(--color-text-main);

    &--lg {
      @include text-title("lg");
    }

    &--md {
      @include text-title("md");
    }

    &--sm {
      @include text-title("sm");
    }
  }

  &__icon {
    color: var(--theme-accent);
  }
}
</style>
