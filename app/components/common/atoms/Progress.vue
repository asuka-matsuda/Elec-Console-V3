<script setup lang="ts">
import { computed } from 'vue'

import type { ProgressProps } from '~/types/components'
import { clampProgress } from '~/utils/progress'

const props = withDefaults(defineProps<ProgressProps>(), {
  value: 0,
  max: 100,
  size: 'md',
  variant: 'success',
  dynamicColors: false,
})

const pct = computed(() => {
  return clampProgress(props.value, 0, props.max)
})

const resolvedColor = computed(() => {
  if (props.color) return props.color

  if (props.dynamicColors) {
    if (pct.value < 60) return 'var(--theme-accent)'
    if (pct.value < 90) return 'var(--color-status-warning)'

    return 'var(--color-status-success)'
  }

  if (props.variant === 'default') return 'var(--theme-accent)'
  if (props.variant === 'warning') return 'var(--color-status-warning)'
  if (props.variant === 'danger') return 'var(--color-status-danger)'

  return 'var(--color-status-success)'
})
</script>

<template>
  <div class="progress-track w-full overflow-hidden" :class="`is-${size}`" :style="{ '--progress-fg': resolvedColor }">
    <div class="progress-fill h-full" :style="{ width: `${pct}%` }" />
  </div>
</template>

<style scoped lang="scss">
.progress-track {
  --progress-height: 8px;

  height: var(--progress-height);
  border-radius: 0;
  background-color: var(--color-track-bg);

  &.is-sm {
    --progress-height: 4px;
  }

  &.is-md {
    --progress-height: 8px;
  }

  &.is-lg {
    --progress-height: 12px;
  }
}

.progress-fill {
  border-radius: 0;
  background-color: var(--progress-fg);
  box-shadow: var(--shadow-glow-sm);
  transition: width var(--duration-normal, 0.3s) var(--ease-out);
}
</style>
