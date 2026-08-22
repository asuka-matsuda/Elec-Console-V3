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
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.1em;

  &__list {
    // Layout & Positioning
    @include flex-start(0, inline-flex);

    position: relative;

    flex-wrap: wrap;

    // Box Model
    padding: var(--pad-container);
    padding-top: calc(var(--pad-container) + var(--space-2));

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
      letter-spacing: normal; // 親のletter-spacingをリセット

      // Visuals & Effects
      opacity: 0.9;

      @include cyber-text-glow(50%, var(--blur-sm), var(--color-category-main));
    }
  }

  &__item {
    // Layout & Positioning
    display: flex;
    gap: var(--gap-element);
    align-items: center;

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
    @include cyber-text-glow(100%, var(--blur-sm), var(--color-text-main));
  }

  &__current {
    // Extends
    @extend %text-heading; // font-size: lg, font-weight: bold, line-height: tight

    // Layout & Positioning
    display: flex;
    gap: var(--gap-element);
    align-items: center;

    // Typography
    color: var(--color-category-main);

    // Visuals & Effects
    @include cyber-text-glow(60%, var(--blur-md), var(--color-category-main));
    @include blinking-cursor(var(--space-2), var(--space-5), currentcolor);
  }
}
</style>

