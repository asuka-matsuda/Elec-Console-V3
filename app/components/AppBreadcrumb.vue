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
    <ol>
      <li
        v-for="(item, index) in items"
        :key="item.href || `${item.text}-${index}`"
      >
        <!-- 中間リンク項目（現場名など） -->
        <NuxtLink
          v-if="item.href && index < items.length - 1"
          :to="item.href"
        >
          {{ item.text }}
        </NuxtLink>

        <!-- 非リンク項目（カテゴリ または 現在地） -->
        <span
          v-else
          :class="{ 'is-current': index === items.length - 1 }"
        >
          {{ item.text }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.c-breadcrumb {
  position: relative;

  display: flex;
  flex-shrink: 0;
  align-items: center;

  padding: var(--space-1) var(--space-2);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  text-transform: uppercase;
  white-space: nowrap;

  ol,
  li {
    display: inline-flex;
    gap: var(--space-2);
    align-items: center;
  }

  li:not(:last-child)::after {
    content: "»";
    user-select: none;

    font-size: var(--font-size-2xs);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
    letter-spacing: var(--tracking-wider);
  }

  a {
    cursor: pointer;
    user-select: none;

    color: var(--color-text-secondary);
    text-decoration: none;

    transition: var(--transition-base);

    &:hover {
      --glow-color: var(--color-text-main);

      color: var(--color-text-main);
      text-shadow: var(--text-glow-sm);
    }
  }

  span {
    user-select: none;
    color: var(--color-text-muted);

    &.is-current {
      --glow-color: var(--theme-accent);

      display: inline-flex;
      gap: var(--space-1);
      align-items: center;

      color: var(--theme-accent);
      text-shadow: var(--text-glow-md);

      &::after {
        content: "";

        display: inline-block;

        width: var(--space-1);
        height: var(--space-3);

        vertical-align: middle;

        background-color: var(--theme-accent);

        animation: ui-cursor-blink 1s step-end infinite;
      }
    }
  }
}
</style>
