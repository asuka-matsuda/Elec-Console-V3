<script setup lang="ts">
/**
 * AppBreadcrumb
 * パンくずリストを表示するためのコンポーネント
 */
import { computed } from "vue";

/** パンくずリストの各要素の型定義 */
export type BreadcrumbItem = {
  text: string;
  href?: string;
};

const props = defineProps<{
  items: BreadcrumbItem[];
}>();

/**
 * テンプレートでの判定ロジックを減らすため、あらかじめ「最後の要素かどうか」を判定した配列を生成する
 */
const processedItems = computed(() => {
  return props.items.map((item, index) => ({
    ...item,
    isLast: index === props.items.length - 1,
    /** keyとして使用できる一意なIDを生成。hrefがあればそれを使用、なければテキスト */
    uniqueKey: item.href ? item.href : `${item.text}-${index}`,
  }));
});
</script>

<template>
  <nav class="c-breadcrumb">
    <ol>
      <li
        v-for="item in processedItems"
        :key="item.uniqueKey"
      >
        <template v-if="!item.isLast">
          <NuxtLink
            v-if="item.href"
            :to="item.href"
          >
            {{ item.text }}
          </NuxtLink>

          <span v-else>
            {{ item.text }}
          </span>
        </template>

        <span
          v-else
          class="current"
        >
          {{ item.text }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.c-breadcrumb {
  @include text-caption;
  @include flex-start(var(--space-inline-gap));
  @include border-base;

  position: relative;
  flex-wrap: wrap;
  padding: var(--space-control-py-sm) var(--space-control-px);
  text-transform: uppercase;

  ol {
    @include inline-flex-start;
  }

  li {
    @include flex-start;

    &:not(:last-child)::after {
      @include text-badge;

      content: "»";
      color: color-mix(in srgb, var(--color-category-main) 60%, transparent);
    }
  }

  a {
    @include click-enabled;
    @include state-base;

    color: var(--color-text-secondary);

    &:hover {
      color: var(--color-text-main);

      @include cyber-text-glow(var(--color-text-main), 100%, var(--blur-sm));
    }
  }

  span:not(.current) {
    @include disabled;
  }

  .current {
    @include flex-start;

    color: var(--color-category-main);

    @include cyber-text-glow(var(--color-category-main), 60%, var(--blur-md));
    @include blinking-cursor;
  }
}
</style>
