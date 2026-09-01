<script setup lang="ts">
/**
 * AppBreadcrumb
 * パンくずリストを表示するためのコンポーネント
 */
import { computed } from 'vue'

/** パンくずリストの各要素の型定義 */
export type BreadcrumbItem = {
  text: string
  href?: string
}

const props = defineProps<{
  items: BreadcrumbItem[]
}>()

/**
 * テンプレートでの判定ロジックを減らすため、あらかじめ「最後の要素かどうか」を判定した配列を生成する
 */
const processedItems = computed(() => {
  return props.items.map((item, index) => ({
    ...item,
    isLast: index === props.items.length - 1,
    /** keyとして使用できる一意なIDを生成。hrefがあればそれを使用、なければテキスト */
    uniqueKey: item.href ? item.href : `${item.text}-${index}`,
  }))
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
        <NuxtLink
          v-if="!item.isLast && item.href"
          :to="item.href"
          class="c-breadcrumb__link"
        >
          {{ item.text }}
        </NuxtLink>

        <span
          v-else
          :class="item.isLast ? 'c-breadcrumb__current' : 'c-breadcrumb__text'"
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
  @include border-base;

  position: relative;
  flex-wrap: wrap;
  padding: var(--space-tag-p);
  text-transform: uppercase;

  &__list {
    @include flex-start-center($is-inline: true);

    gap: var(--space-inline-gap);
  }

  &__item {
    @include flex-start-center($is-inline: true);

    gap: var(--space-inline-gap);

    &:not(:last-child)::after {
      @include text-badge;

      content: "»";
      color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
    }
  }

  &__link {
    @include click-enabled;
    @include state-base;

    color: var(--color-text-secondary);

    &:hover {
      @include cyber-text-glow(var(--color-text-main), 100%, var(--blur-sm));

      color: var(--color-text-main);
    }
  }

  &__text {
    @include disabled;
  }

  &__current {
    @include cyber-text-glow(var(--theme-accent), 60%, var(--blur-md));

    color: var(--theme-accent);

    @include blinking-cursor($color: var(--theme-accent));
  }
}
</style>
