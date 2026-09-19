<script setup lang="ts">
/**
 * Disclaimer
 * [Molecules] 免責事項・注意事項を表示する枠コンポーネント。
 * 余計なスロットやスタイルの多重定義を排した最小限の設計。
 */
import type { DisclaimerProps } from '~/types/components'

defineProps<DisclaimerProps>()
</script>

<template>
  <div v-if="text" class="disclaimer flex shrink-0 items-start gap-2 py-2 px-3">
    <Icon name="alert-triangle" class="mt-0.5 shrink-0" />
    <span class="flex-1 min-w-0 break-words">
      {{ text }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.disclaimer {
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-status-warning) 20%, transparent);

  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-status-warning);

  background-color: color-mix(in srgb, var(--color-status-warning) 6%, var(--surface-bg));
}
</style>
