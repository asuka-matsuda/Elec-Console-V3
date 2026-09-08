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
    <ol class="inline-flex items-center gap-2">
      <li
        v-for="(item, index) in items"
        :key="item.href || `${item.text}-${index}`"
        class="inline-flex items-center gap-2"
      >
        <!-- 中間リンク項目（現場名など） -->
        <NuxtLink
          v-if="item.href && index < items.length - 1"
          :to="item.href"
          class="item-link"
        >
          {{ item.text }}
        </NuxtLink>

        <!-- 非リンク項目（カテゴリ または 現在地） -->
        <span
          v-else
          class="inline-flex items-center gap-1 item-label"
          :class="{ 'is-current': index === items.length - 1 }"
        >
          {{ item.text }}
          <!-- 現在地を示す点滅カーソル -->
          <span
            v-if="index === items.length - 1"
            class="cursor-bar"
            aria-hidden="true"
          />
        </span>

        <!-- 階層の区切り文字 -->
        <span
          v-if="index < items.length - 1"
          class="separator"
          aria-hidden="true"
        >
          »
        </span>
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

  .separator {
    user-select: none;

    font-size: var(--font-size-2xs);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
    letter-spacing: var(--tracking-wider);
  }

  .item-link {
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

  .item-label {
    user-select: none;
    color: var(--color-text-muted);

    &.is-current {
      --glow-color: var(--theme-accent);

      color: var(--theme-accent);
      text-shadow: var(--text-glow-md);
    }
  }

  .cursor-bar {
    display: inline-block;

    width: var(--space-1);
    height: var(--space-3);

    vertical-align: middle;

    background-color: var(--theme-accent);

    animation: ui-cursor-blink 1s step-end infinite;
  }
}
</style>
