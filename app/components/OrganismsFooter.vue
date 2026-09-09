<script setup lang="ts">
/**
 * OrganismsFooter
 * [Organisms] アプリケーション最下部のフッターコンポーネント。
 * 区切り線（AtomsDivider）とコピーライトテキスト、サイバーテキスト発光ホバー演出を表示します。
 */
import type { OrganismsFooterProps } from '~/types/components'

const {
  year = new Date().getFullYear(),
  text,
} = defineProps<OrganismsFooterProps>()
</script>

<template>
  <footer class="mt-auto flex flex-col items-center gap-[var(--space-3)] pt-[var(--space-layout-pad)] text-center footer">
    <AtomsDivider type="fade-center" />
    <p class="font-mono text-[var(--font-size-2xs)] tabular-nums tracking-[var(--tracking-normal)] copyright">
      <slot>
        {{ text || `© ${year} Mat.Operate & Gemini 3.1 Pro. / Elec-Console All rights reserved.` }}
      </slot>
    </p>
  </footer>
</template>

<style scoped lang="scss">
.copyright {
  color: var(--color-text-muted);
  transition: var(--transition-base);

  &:hover {
    --glow-color: var(--color-text-secondary);

    color: var(--color-text-secondary);
    text-shadow: var(--text-glow-sm);
  }
}
</style>
