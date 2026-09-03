<script setup lang="ts">
/**
 * AppBreadcrumb
 * パンくずリストを表示するためのコンポーネント
 */
import { computed, resolveComponent } from 'vue'

export interface BreadcrumbItem {
  text: string
  href?: string
}

const props = defineProps<{
  items: BreadcrumbItem[]
}>()

const processedItems = computed(() => {
  const NuxtLink = resolveComponent('NuxtLink')

  return props.items.map((item, index) => {
    const isLast = index === props.items.length - 1
    const isLink = !isLast && !!item.href

    return {
      text: item.text,
      href: isLink ? item.href : undefined,
      tag: isLink ? NuxtLink : 'span',
      className: isLink
        ? 'c-breadcrumb__link'
        : isLast
          ? 'c-breadcrumb__current'
          : 'c-breadcrumb__text',
      uniqueKey: item.href || `${item.text}-${index}`,
    }
  })
})
</script>

<template>
  <nav class="c-breadcrumb">
    <ol class="c-breadcrumb__list">
      <li
        v-for="item in processedItems"
        :key="item.uniqueKey"
        class="c-breadcrumb__item"
      >
        <component :is="item.tag" :to="item.href" :class="item.className">
          {{ item.text }}
        </component>
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
      color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
    }
  }

  &__link {
    @include click-enabled;

    color: var(--color-text-secondary);

    @include state-base;

    &:hover {
      color: var(--color-text-main);

      @include cyber-text-glow(var(--color-text-main), 100%, var(--blur-sm));
    }
  }

  &__text {
    @include disabled;
  }

  &__current {
    color: var(--theme-accent);

    @include cyber-text-glow(var(--theme-accent), 60%, var(--blur-md));
    @include blinking-cursor($color: var(--theme-accent));
  }
}
</style>
