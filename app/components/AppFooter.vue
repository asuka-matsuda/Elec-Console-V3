<script setup lang="ts">
/**
 * AppFooter
 * アプリケーションのフッター部分（コピーライト等）を表示するコンポーネントです。
 */
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="c-footer">
    <AppDivider type="fade-center" />
    <p class="c-footer__copyright">
      &copy; {{ currentYear }} Mat.Operate &amp; Gemini 3.1 Pro. / Elec-Console
      All rights reserved.
    </p>
  </footer>
</template>

<style scoped lang="scss">
.c-footer {
  @include flex-start-center($direction: column);

  gap: var(--space-3);
  margin-top: auto;
  padding: var(--space-layout-pad) 0 0;
  text-align: center;

  &__copyright {
    @include text-mono("2xs");

    color: var(--color-text-muted);

    @include state-base;

    &:hover {
      @include cyber-text-glow(var(--color-text-secondary), 100%, var(--blur-sm));
    }
  }
}
</style>
