<script setup lang="ts">
/**
 * AtomsProgressBar
 * [Portal Atoms] プログレスバーコンポーネント（最小パーツ）
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
    class="w-full h-2 overflow-hidden bar-track"
    :style="{ '--bar-color': color }"
  >
    <div
      class="h-full bar-fill"
      :style="{ width: `${pct}%` }"
    />
  </div>
</template>

<style scoped lang="scss">
.bar-track {
  --bar-color: var(--color-status-success);

  border-radius: var(--radius-full);
  background-color: var(--color-track-bg);
}

.bar-fill {
  --glow-color: var(--bar-color);

  border-radius: var(--radius-full);
  background: linear-gradient(
    90deg,
    var(--bar-color),
    color-mix(in srgb, var(--bar-color) 85%, var(--color-overlay))
  );
  box-shadow: var(--shadow-glow-sm);
  transition: width var(--duration-slow) var(--ease-out);
}
</style>
