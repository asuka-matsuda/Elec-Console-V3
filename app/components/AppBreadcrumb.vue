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
  @include inline-flex-start(0);

  // --- 視覚効果 ---
  @include border-base;

  // --- レイアウト・配置 ---
  position: relative;

  // --- ボックスモデル ---
  padding: var(--pad-component);
  padding-top: calc(var(--pad-component) + var(--pad-component));

  // --- タイポグラフィ ---
  text-transform: uppercase;

  // --- 疑似要素 ---
  &::after {
    // --- 継承 ---
    @extend %text-label;

    content: "SYS.LOC";

    // --- レイアウト・配置 ---
    position: absolute;
    top: var(--space-1);
    left: var(--space-2);

    // --- タイポグラフィ ---
    color: var(--color-category-main);

    // --- 視覚効果 ---
    @include cyber-text-glow(var(--color-category-main), 50%, var(--blur-sm));
  }

  // --- 子要素 ---
  ol {
    // --- レイアウト・配置 ---
    @include inline-flex-start(0);

    list-style: none;
  }

  li {
    // --- レイアウト・配置 ---
    @include flex-start;

    // --- 疑似要素 ---
    &:not(:last-child)::after {
      // --- 継承 ---
      @extend %text-label;

      content: "»";

      // --- タイポグラフィ ---
      color: theme-color(var(--color-category-main), 60%);
    }
  }

  // --- 疑似クラス ---
  a,
  span:not(.current) {
    // --- 継承 ---
    @extend %text-meta;

    // --- 視覚効果 ---
    transition: var(--transition-base);
  }

  a:hover {
    // --- タイポグラフィ ---
    color: var(--color-text-main);

    // --- 視覚効果 ---
    @include cyber-text-glow(var(--color-text-main), 100%, var(--blur-sm));
  }

  .current {
    // --- レイアウト・配置 ---
    @include flex-start;

    // --- タイポグラフィ ---
    color: var(--color-category-main);

    // --- 視覚効果 ---
    @include cyber-text-glow(var(--color-category-main), 60%, var(--blur-md));
    @include blinking-cursor;
  }
}
</style>
