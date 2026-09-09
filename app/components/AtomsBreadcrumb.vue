<script setup lang="ts">
/**
 * AtomsBreadcrumb
 * [Atoms] パンくずリストを表示するための最小UIコンポーネント
 */
import type { BreadcrumbItem } from '~/types/components'

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <nav
    class="relative flex shrink-0 items-center py-1 px-2 whitespace-nowrap breadcrumb"
    aria-label="パンくずリスト"
  >
    <ol class="flex items-center gap-2">
      <li
        v-for="(item, index) in items"
        :key="`${item.text}-${index}`"
        class="flex items-center"
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
  font-size: var(--font-size-sm);
  text-transform: uppercase;

  li {
    user-select: none;
    color: var(--color-text-muted);

    &:not(:last-child)::after {
      content: "»";

      margin-left: var(--space-2);

      font-size: var(--font-size-2xs);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
      color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
      letter-spacing: var(--tracking-wider);
    }

    &.is-current {
      --glow-color: var(--theme-accent);

      color: var(--theme-accent);
      text-shadow: var(--text-glow-md);

      &::after {
        content: "";

        display: inline-block;

        width: var(--space-1);
        height: var(--space-3);
        margin-left: var(--space-1);

        vertical-align: middle;

        background-color: var(--theme-accent);

        animation: ui-cursor-blink 1s step-end infinite;
      }
    }
  }
}
</style>
