<script setup lang="ts">
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
  position: relative;
  padding: var(--space-6) var(--space-4) var(--space-4);
  margin-top: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);

  &__divider {
    width: 100%;
    max-width: 600px;
  }

  &__copyright {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    letter-spacing: 0.05em;
    transition: var(--transition-base);

    &:hover {
      color: var(--color-text-secondary);
      @include cyber-text-glow(30%, 4px, var(--color-text-secondary));
    }
  }
}
</style>
