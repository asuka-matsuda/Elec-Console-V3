<script setup lang="ts">
/**
 * LayoutFooter
 * アプリケーションのフッター部分（コピーライト等）を表示するコンポーネントです。
 */
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="l-footer">
    <AppDivider type="fade-center" class="l-footer__divider" />
    <p class="l-footer__copyright">
      &copy; {{ currentYear }} Mat.Operate &amp; Gemini 3.1 Pro. / Elec-Console
      All rights reserved.
    </p>
  </footer>
</template>

<style scoped lang="scss">
.l-footer {
  // --- レイアウト・配置 ---
  position: relative;

  @include flex-column;

  align-items: center;

  // --- ボックスモデル ---
  margin-top: auto;
  padding: var(--pad-container);

  // --- タイポグラフィ ---
  text-align: center;

  // --- 子要素 ---
  &__divider {
    // --- ボックスモデル ---
    width: 100%;
    max-width: var(--width-md);
  }

  &__copyright {
    // --- 継承 ---
    @extend %text-meta;

    // --- タイポグラフィ ---
    font-family: var(--font-mono);
    color: var(--color-text-muted);

    // --- 視覚効果 ---
    @include state-base;

    // --- 疑似クラス ---
    &:hover {
      // --- タイポグラフィ ---
      color: var(--color-text-secondary);

      // --- 視覚効果 ---
      @include cyber-text-glow(
        30%,
        var(--blur-sm),
        var(--color-text-secondary)
      );
    }
  }
}
</style>
