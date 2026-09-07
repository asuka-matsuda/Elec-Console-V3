<script setup lang="ts">
/**
 * AppBreadcrumb
 * パンくずリストを表示するためのコンポーネント
 */
import type { BreadcrumbItem } from '~/types/components'

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <nav class="c-breadcrumb">
    <ol class="c-breadcrumb__list">
      <li
        v-for="(item, index) in items"
        :key="item.href || `${item.text}-${index}`"
        class="c-breadcrumb__item"
      >
        <!-- 中間リンク項目（現場名など） -->
        <NuxtLink
          v-if="item.href && index < items.length - 1"
          :to="item.href"
          class="c-breadcrumb__link"
        >
          {{ item.text }}
        </NuxtLink>

        <!-- 非リンク項目（カテゴリ または 現在地） -->
        <span
          v-else
          :class="index === items.length - 1 ? 'c-breadcrumb__current' : 'c-breadcrumb__text'"
        >
          {{ item.text }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.c-breadcrumb {
  @include flex-start-center;
  @include text-caption;

  position: relative;

  flex-shrink: 0;

  padding: var(--space-1) var(--space-2);

  text-transform: uppercase;
  white-space: nowrap;

  @include border-base;

  &__list {
    @include flex-start-center($is-inline: true);

    gap: var(--space-2);
  }

  &__item {
    @include flex-start-center($is-inline: true);

    gap: var(--space-2);

    &:not(:last-child)::after {
      @include text-badge;

      content: "»";
      user-select: none;
      color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
    }
  }

  &__link {
    @include click-enabled;

    display: inline-flex;
    align-items: center;
    color: var(--color-text-secondary);
    text-decoration: none;

    @include state-base;

    &:hover {
      color: var(--color-text-main);

      @include cyber-text-glow(var(--color-text-main), 100%, var(--blur-sm));
    }
  }

  &__text {
    user-select: none;
    display: inline-flex;
    align-items: center;
    color: var(--color-text-muted);
  }

  &__current {
    display: inline-flex;
    align-items: center;
    color: var(--theme-accent);

    @include cyber-text-glow(var(--theme-accent), 60%, var(--blur-md));
    @include blinking-cursor($color: var(--theme-accent));
  }
}
</style>
