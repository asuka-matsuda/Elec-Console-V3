<script setup lang="ts">
/**
 * LayoutLogo
 * アプリケーションのロゴを表示し、クリック時にホームへ遷移またはイベントを発火するコンポーネント。
 */
const emit = defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <NuxtLink to="/" class="c-logo" @click="emit('click')">
    <AppIcon name="zap" class="c-logo__icon" />
    <span class="c-logo__text">Elec-Console</span>
  </NuxtLink>
</template>

<style scoped lang="scss">
.c-logo {
  // --- レイアウト・配置 ---
  @include flex-start(var(--gap-section));

  // --- 視覚効果 ---
  @include state-base;

  // --- 疑似クラス ---
  &:hover {
    // --- 子要素 ---
    .c-logo__icon {
      // --- 視覚効果 ---
      @include cyber-text-glow(var(--color-category-main), 60%, var(--blur-md));

      transform: scale(1.1);
    }
  }

  // --- 子要素 ---
  &__icon {
    // --- ボックスモデル ---
    width: var(--icon-size-md);
    height: var(--icon-size-md);

    // --- タイポグラフィ ---
    color: var(--color-category-main);

    // --- 視覚効果 ---
    @include state-base;
  }

  &__text {
    // --- 継承 ---
    @extend %text-title-md;
  }
}
</style>
