<script setup lang="ts">
/**
 * LayoutFooter
 * アプリケーションのフッター部分（コピーライト等）を表示するコンポーネントです。
 */
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="l-footer">
    <AppDivider
      type="fade-center"
      class="l-footer__divider"
    />
    <p class="l-footer__copyright">
      &copy; {{ currentYear }} Mat.Operate &amp; Gemini 3.1 Pro. / Elec-Console
      All rights reserved.
    </p>
  </footer>
</template>

<style scoped lang="scss">
.l-footer {
  position: relative;

  @include flex-column;

  align-items: center;

  margin-top: auto;
  padding: var(--space-layout-pad) 0 0;

  text-align: center;

  &__divider {
    width: 100%;
    max-width: var(--width-md);
  }

  &__copyright {
    @include text-meta;

    font-family: var(--font-mono);
    color: var(--color-text-muted);

    @include state-base;

    &:hover {
      color: var(--color-text-secondary);

      @include cyber-text-glow(
        var(--color-text-secondary),
        30%,
        var(--blur-sm)
      );
    }
  }
}
</style>
