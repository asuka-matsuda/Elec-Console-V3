<script setup lang="ts">
import { computed } from "vue";

/* ==========================================================================
   型定義
   ========================================================================== */

// パンくずリストの各項目の型定義
export type BreadcrumbItem = {
  text: string;
  href?: string;
};

/* ==========================================================================
   Props定義
   ========================================================================== */

const props = defineProps<{
  items: BreadcrumbItem[];
}>();

/* ==========================================================================
   算出プロパティ (Computed)
   ========================================================================== */

// テンプレート側での判定ロジックを減らすため、あらかじめ「最後の要素かどうか」を判定した配列を生成する
const processedItems = computed(() => {
  return props.items.map((item, index) => ({
    ...item,
    isLast: index === props.items.length - 1,
    // keyとして使用できる一意のIDを生成（hrefがあればそれを使用、なければテキスト）
    uniqueKey: item.href ? item.href : `${item.text}-${index}`,
  }));
});
</script>

<template>
  <!-- ==========================================================================
       パンくずリスト本体
       ========================================================================== -->
  <nav class="c-breadcrumb" aria-label="Breadcrumb">
    <ol class="c-breadcrumb__list">
      <li
        v-for="item in processedItems"
        :key="item.uniqueKey"
        class="c-breadcrumb__item"
      >
        <!-- 最後の項目以外（リンク付き、またはただのテキスト） -->
        <template v-if="!item.isLast">
          <NuxtLink v-if="item.href" :to="item.href" class="c-breadcrumb__link">
            {{ item.text }}
          </NuxtLink>

          <span v-else class="c-breadcrumb__text">
            {{ item.text }}
          </span>
        </template>

        <!-- 最後の項目（現在のページを表す） -->
        <span v-else class="c-breadcrumb__current" aria-current="page">
          {{ item.text }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
/* ==========================================================================
   パンくずリストのスタイル
   ========================================================================== */

.c-breadcrumb {
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.1em;

  // パンくずリストのコンテナ
  &__list {
    position: relative;
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    padding: var(--pad-container);
    padding-top: calc(var(--pad-container) + var(--space-2)); // SYS.LOCとの距離を確保
    list-style: none;

    @include ui-surface;

    // 左上の「SYS.LOC」ラベル（装飾）
    &::after {
      position: absolute;
      top: var(--space-1);
      left: 6px;
      font-size: 9px;
      color: var(--color-category-main);
      content: "SYS.LOC";
      opacity: 0.9;

      @include cyber-text-glow(50%, var(--blur-sm), var(--color-category-main));
    }
  }

  // リストの各項目
  &__item {
    display: flex;
    align-items: center;
    gap: var(--gap-element);

    // 項目の区切り文字（最後の子要素以外に付与）
    &:not(:last-child)::after {
      font-size: var(--font-size-xs);
      color: color-mix(in srgb, var(--color-category-main) 60%, transparent);
      content: "»";
    }
  }

  // リンクとテキストの基本スタイル
  &__link,
  &__text {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-decoration: none;
    transition: var(--transition-base);
  }

  // リンクのホバーエフェクト
  &__link:hover {
    color: var(--color-text-main);

    @include cyber-text-glow(50%, var(--blur-md), var(--color-text-main));
  }

  // 最後の項目（現在のページ）のスタイル
  // 視覚的にページタイトル（h1相当）として機能するよう強調
  &__current {
    display: flex;
    gap: var(--gap-element);
    align-items: center;
    font-size: var(
      --font-size-lg
    ); // 以前の --text-md は存在しなかったため lg に修正

    color: var(--color-category-main);
    line-height: 1;

    @include cyber-text-glow(60%, var(--blur-md), var(--color-category-main));

    // 点滅するカーソルエフェクト
    @include ui-blinking-cursor(var(--space-2), var(--space-5), currentcolor);
  }
}
</style>
