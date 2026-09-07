<script setup lang="ts">
/**
 * AppFooter
 * アプリケーションのフッター部分（コピーライト等）を表示するコンポーネントです。
 */

interface Props {
  year?: number | string
  text?: string
}

const {
  year = new Date().getFullYear(),
  text,
} = defineProps<Props>()
</script>

<template>
  <footer class="footer">
    <AppDivider type="fade-center" />
    <p class="copyright">
      <slot>
        {{ text || `© ${year} Mat.Operate & Gemini 3.1 Pro. / Elec-Console All rights reserved.` }}
      </slot>
    </p>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;

  margin-top: auto;
  padding-top: var(--space-layout-pad);

  text-align: center;
}

.copyright {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xs);
  font-variant-numeric: tabular-nums;
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
  letter-spacing: var(--tracking-normal);

  transition: var(--transition-base);

  &:hover {
    --glow-color: var(--color-text-secondary);

    color: var(--color-text-secondary);
    text-shadow: var(--text-glow-sm);
  }
}
</style>
