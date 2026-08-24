<script setup lang="ts">
/**
 * AppCard
 * コンテンツをまとめるためのカード型コンポーネント
 */
import { computed, resolveComponent } from "vue";

const props = defineProps<{
  variant?:
    | "default"
    | "main"
    | "tool"
    | "database"
    | "reference"
    | "management";
  to?: string;
  href?: string;
  disabled?: boolean;
}>();

const rootTag = computed(() => {
  if (props.to) return resolveComponent("NuxtLink");
  if (props.href) return "a";
  return "div";
});

const rootProps = computed(() => {
  if (props.to) return { to: props.to };
  if (props.href) return { href: props.href };
  return {};
});
</script>

<template>
  <component
    :is="rootTag"
    v-bind="rootProps"
    class="c-card"
    :class="[variant ? `c-card--${variant}` : '', { 'is-disabled': disabled }]"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.c-card {
  // --- レイアウト・配置 ---
  position: relative;

  @include flex-column(var(--gap-section));


  // --- ボックスモデル ---

  padding: var(--pad-container);


  // --- 視覚効果 ---

  @include state-base(none, var(--transition-base));

  @include surface(15%);

  // --- 疑似クラス ---
  &:is(a, button) {
    // --- その他 ---
    cursor: pointer;


    // --- 疑似クラス ---

    &:not(.is-disabled):hover {
      @include state-hover(var(--card-accent, var(--color-category-main)));
    }

    &:not(.is-disabled):active {
      @include state-active(var(--card-accent, var(--color-category-main)));
    }
  }


  // --- モディファイア ---

  &.is-disabled {
    // --- 継承 ---
    @extend %disabled;
  }

  &--tool {
    // --- CSSカスタムプロパティ ---
    --card-accent: var(--color-category-tool);
  }

  &--database {
    // --- CSSカスタムプロパティ ---
    --card-accent: var(--color-category-database);
  }

  &--reference {
    // --- CSSカスタムプロパティ ---
    --card-accent: var(--color-category-reference);
  }

  &--management {
    // --- CSSカスタムプロパティ ---
    --card-accent: var(--color-category-management);
  }
}
</style>
