<script setup lang="ts">
/**
 * AtomsProgressBar
 * [Atoms] 汎用プログレスバーコンポーネント（最小パーツ）
 */
import { computed } from 'vue'

const {
  value = 0,
  max = 100,
  color = 'var(--color-status-success)',
} = defineProps<{
  value?: number
  max?: number
  color?: string
}>()

const pct = computed(() => {
  if (max <= 0) return 0

  return Math.min(100, Math.max(0, Math.round((value / max) * 100)))
})
</script>

<template>
  <div
    class="w-full h-2 overflow-hidden rounded-full bar-track"
    role="progressbar"
    :aria-valuenow="value"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :style="{ '--bar-color': color }"
  >
    <div
      class="h-full rounded-full bar-fill"
      :style="{ width: `${pct}%` }"
    />
  </div>
</template>

<style scoped lang="scss">
.bar-track {
  --bar-color: var(--color-status-success);

  background-color: var(--color-track-bg);
}

.bar-fill {
  background: linear-gradient(
    90deg,
    var(--bar-color),
    color-mix(in srgb, var(--bar-color) 85%, var(--color-overlay))
  );
  box-shadow: 0 0 6px color-mix(in srgb, var(--bar-color) 60%, transparent);
  transition: width var(--duration-slow) var(--ease-out);
}
</style>
