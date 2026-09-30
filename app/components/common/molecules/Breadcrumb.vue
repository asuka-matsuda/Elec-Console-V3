<script setup lang="ts">
/**
 * Breadcrumb
 * [Molecules] 現在地（コンテキスト階層）を視覚的に表示するロケーションインジケーター
 */
import type { BreadcrumbProps } from '~/types/components'

withDefaults(defineProps<BreadcrumbProps>(), {
  items: () => [],
  separator: '»',
  showCursor: true,
})
</script>

<template>
  <nav
    v-if="items && items.length > 0"
    class="flex shrink-0 items-center whitespace-nowrap breadcrumb"
  >
    <ol class="flex items-center gap-item-gap">
      <li
        v-for="(item, index) in items"
        :key="`${item.text}-${index}`"
        class="flex items-center gap-item-gap"
        :class="{
          'is-active': index === items.length - 1,
          'has-cursor': showCursor && index === items.length - 1,
        }"
      >
        <span>{{ item.text }}</span>

        <span
          v-if="index < items.length - 1"
          class="separator"
        >
          <slot name="separator">{{ separator }}</slot>
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.breadcrumb {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  letter-spacing: var(--tracking-wide);

  li {
    color: var(--color-text-muted);

    &.is-active {
      font-weight: var(--font-weight-medium);
      color: var(--theme-accent);

      &.has-cursor::after {
        content: "";

        width: var(--space-1);
        height: var(--space-3);
        margin-inline-start: var(--space-1);

        background-color: var(--theme-accent);

        animation: ui-cursor-blink 1s step-end infinite;
      }
    }
  }

  .separator {
    font-size: 0.85em;
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
    letter-spacing: var(--tracking-wider);
  }
}

@keyframes ui-cursor-blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}
</style>
