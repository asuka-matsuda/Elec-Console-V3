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
    <ol class="c-breadcrumb__list">
      <li
        v-for="item in processedItems"
        :key="item.uniqueKey"
        class="c-breadcrumb__item"
      >
        <template v-if="!item.isLast">
          <NuxtLink v-if="item.href" :to="item.href" class="c-breadcrumb__link">
            {{ item.text }}
          </NuxtLink>

          <span v-else class="c-breadcrumb__text">
            {{ item.text }}
          </span>
        </template>

        <span v-else class="c-breadcrumb__current">
          {{ item.text }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.c-breadcrumb {
  // Extends & Typography Base
  @extend %text-caption;

  @include border-dim;

  text-transform: uppercase;

  &__list {
    // Layout & Positioning
    @include flex-start(0, inline-flex);

    position: relative;

    flex-wrap: wrap;

    // Box Model
    padding: var(--pad-component);
    padding-top: calc(var(--pad-component) + var(--space-2));

    // Typography
    list-style: none;

    // Visuals & Effects
    @include surface;

    // 左上の「SYS.LOC」ラベル
    &::after {
      // Extends
      @extend %text-label;

      content: "SYS.LOC";

      // Layout & Positioning
      position: absolute;
      top: var(--space-1);
      left: var(--space-2);

      // Typography
      color: var(--color-category-main);
      letter-spacing: normal;

      // Visuals & Effects
      @include cyber-text-glow(var(--color-category-main), 50%, var(--blur-sm));
    }
  }

  &__item {
    // Layout & Positioning
    @include flex-start;

    // 項目の区切り文字（最後の要素以外に付与）
    &:not(:last-child)::after {
      content: "»";

      // Typography
      font-size: var(--font-size-xs);
      color: theme-color(var(--color-category-main), 60%);
    }
  }

  &__link,
  &__text {
    // Extends
    @extend %text-xs;

    // Typography
    color: var(--color-text-muted);
    text-decoration: none;

    // Visuals & Effects
    transition: var(--transition-base);
  }

  &__link:hover {
    // Typography
    color: var(--color-text-main);

    // Visuals & Effects
    @include cyber-text-glow(var(--color-text-main), 100%, var(--blur-sm));
  }

  &__current {
    // Layout & Positioning
    @include flex-start;

    // Typography
    color: var(--color-category-main);

    // Visuals & Effects
    @include cyber-text-glow(var(--color-category-main), 60%, var(--blur-md));
    @include blinking-cursor;
  }
}
</style>
