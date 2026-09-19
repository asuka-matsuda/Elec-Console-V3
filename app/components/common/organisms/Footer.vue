<script setup lang="ts">
/**
 * Footer
 * [Organisms] 最下部の区切り線とコピーライトを表示するフッター。
 */
import type { FooterProps } from '~/types/components'

const {
  year = new Date().getFullYear(),
  text,
} = defineProps<FooterProps>()
</script>

<template>
  <footer class="mt-auto flex flex-col items-center gap-3 pt-layout-pad text-center">
    <Divider type="fade-center" />
    <p class="copyright">
      <slot>{{ text || `© ${year} Mat.Operate & Gemini 3.8 Flash. / Elec-Console All rights reserved.` }}</slot>
    </p>
  </footer>
</template>

<style scoped lang="scss">
.copyright {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}
</style>
