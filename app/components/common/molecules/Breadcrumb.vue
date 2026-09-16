<script setup lang="ts">
/**
 * Breadcrumb
 * [Molecules] パンくずリストを表示するためのUIコンポーネント
 */
import type { BreadcrumbItem } from '~/types/components'

withDefaults(
  defineProps<{
    items?: BreadcrumbItem[]
  }>(),
  {
    items: () => [],
  },
)
</script>

<template>
  <nav
    v-if="items && items.length > 0"
    class="flex shrink-0 items-center py-1 px-2 whitespace-nowrap breadcrumb"
  >
    <ol class="flex items-center gap-2">
      <li
        v-for="(item, index) in items"
        :key="`${item.text}-${index}`"
        class="flex items-center gap-2"
        :class="{ 'is-current': index === items.length - 1 }"
      >
        {{ item.text }}
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.breadcrumb {
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: inherit;

  li {
    color: var(--color-text-muted);

    &:not(:last-child)::after {
      content: "»";

      font-size: 0.85em;
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
      color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
      letter-spacing: var(--tracking-wider);
    }

    &.is-current {
      gap: var(--space-1);
      color: var(--theme-accent);

      &::after {
        content: "";

        width: var(--space-1);
        height: var(--space-3);

        background-color: var(--theme-accent);

        animation: ui-cursor-blink 1s step-end infinite;
      }
    }
  }
}
</style>
