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
      <li v-for="item in processedItems" :key="item.uniqueKey">
        <template v-if="!item.isLast">
          <NuxtLink v-if="item.href" :to="item.href">
            {{ item.text }}
          </NuxtLink>

          <span v-else>
            {{ item.text }}
          </span>
        </template>

        <span v-else class="current">
          {{ item.text }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.c-breadcrumb {
  // --- 継承 ---
  @extend %text-caption;

  // --- レイアウト・配置 ---
  @include flex-start(0, inline-flex);

  // --- 視覚効果 ---
  @include surface;

  position: relative;

  // --- ボックスモデル ---
  padding: var(--pad-component);
  padding-top: calc(var(--pad-component) + var(--pad-component));

  // --- タイポグラフィ ---
  text-transform: uppercase;

  // --- 疑似要素 ---
  &::after {
    @extend %text-label;

    content: "SYS.LOC";

    position: absolute;
    top: var(--space-1);
    left: var(--space-2);

    color: var(--color-category-main);

    @include cyber-text-glow(var(--color-category-main), 50%, var(--blur-sm));
  }

  // --- 子要素 ---
  ol {
    @include flex-start(0, inline-flex);

    list-style: none;
  }

  li {
    @include flex-start;

    &:not(:last-child)::after {
      @extend %text-label;

      content: "»";

      color: theme-color(var(--color-category-main), 60%);
    }
  }

  a,
  span:not(.current) {
    @extend %text-xs;

    color: var(--color-text-muted);

    transition: var(--transition-base);
  }

  a:hover {
    color: var(--color-text-main);

    @include cyber-text-glow(var(--color-text-main), 100%, var(--blur-sm));
  }

  .current {
    @include flex-start;

    color: var(--color-category-main);

    @include cyber-text-glow(var(--color-category-main), 60%, var(--blur-md));
    @include blinking-cursor;
  }
}
</style>
