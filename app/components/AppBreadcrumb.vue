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
  // --- Base Styles ---
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.1em;

  // --- Layout Modifiers ---
  &__list {
    position: relative;

    flex-wrap: wrap;

    padding: var(--pad-container);
    padding-top: calc(var(--pad-container) + var(--space-2));

    list-style: none;

    @include flex-start(0, true);
    @include surface;

    // 左上の「SYS.LOC」ラベル
    &::after {
      content: "SYS.LOC";

      position: absolute;
      top: var(--space-1);
      left: var(--space-2);

      font-size: 0.6em;
      color: var(--color-category-main);

      opacity: 0.9;

      @include cyber-text-glow(50%, var(--blur-sm), var(--color-category-main));
    }
  }

  &__item {
    display: flex;
    gap: var(--gap-element);
    align-items: center;

    // 項目の区切り文字（最後の子要素以外に付与）
    &:not(:last-child)::after {
      content: "»";
      font-size: var(--font-size-xs);
      color: theme-color(var(--color-category-main), 60%);
    }
  }

  &__link,
  &__text {
    @extend %text-xs;

    color: var(--color-text-muted);
    text-decoration: none;
    transition: var(--transition-base);
  }

  // --- State Modifiers ---
  &__link:hover {
    color: var(--color-text-main);

    @include cyber-text-glow(50%, var(--blur-md), var(--color-text-main));
  }

  &__current {
    @extend %text-lg;

    display: flex;
    gap: var(--gap-element);
    align-items: center;

    line-height: 1;
    color: var(--color-category-main);

    @include cyber-text-glow(60%, var(--blur-md), var(--color-category-main));
    @include blinking-cursor(var(--space-2), var(--space-5), currentcolor);
  }
}
</style>
