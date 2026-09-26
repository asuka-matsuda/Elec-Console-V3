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
  <footer class="mt-auto flex flex-col items-center gap-item-gap pt-layout-pad text-center">
    <Divider type="fade-center" />
    <small>
      <slot>{{ text || `© ${year} Mat.Operate & Gemini 3.8 Flash. / Elec-Console All rights reserved.` }}</slot>
    </small>
  </footer>
</template>
