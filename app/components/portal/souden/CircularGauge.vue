<script setup lang="ts">
/**
 * CircularGauge
 * [Portal Atoms] 送電試験などの進捗率を表現する円形プログレスゲージコンポーネント
 */
import { computed } from 'vue'

import { calcCircleProgress } from '~/utils/progress'

const {
  value = 0,
  label,
  size = 'md',
  color = 'var(--color-status-success)',
} = defineProps<{
  value?: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}>()

const RADIUS = 42
const gauge = computed(() => calcCircleProgress(value, RADIUS))
</script>

<template>
  <div
    class="relative flex flex-col items-center justify-center gap-inline-gap circular-gauge"
    :class="`is-${size}`"
    :style="{ '--gauge-color': color }"
  >
    <svg
      class="absolute inset-0 -rotate-90 gauge-svg"
      viewBox="0 0 100 100"
    >
      <circle
        class="gauge-track"
        cx="50"
        cy="50"
        :r="RADIUS"
      />
      <circle
        class="gauge-progress"
        cx="50"
        cy="50"
        :r="RADIUS"
        :style="{
          strokeDasharray: gauge.circumference,
          strokeDashoffset: gauge.strokeDashoffset,
          opacity: gauge.value === 0 ? 0 : 1,
        }"
      />
    </svg>

    <div class="inline-flex items-baseline gap-inline-gap value">
      {{ gauge.value }}<span class="unit">%</span>
    </div>
    <span v-if="label" class="label">
      {{ label }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.circular-gauge {
  --gauge-size: 160px;
  --gauge-stroke-width: 8;

  width: var(--gauge-size);
  height: var(--gauge-size);

  .gauge-svg {
    pointer-events: none;
    width: 100%;
    height: 100%;
  }

  .gauge-track {
    fill: none;
    stroke: var(--color-track-bg);
    stroke-width: var(--gauge-stroke-width);
  }

  .gauge-progress {
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--gauge-color, var(--color-status-success)) 40%, transparent));

    fill: none;
    stroke: var(--gauge-color, var(--color-status-success));
    stroke-linecap: round;
    stroke-width: var(--gauge-stroke-width);

    transition: stroke-dashoffset var(--duration-slow) var(--ease-out), opacity var(--duration-fast) var(--ease-out);
  }

  .value {
    font-family: var(--font-mono);
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    line-height: 1;
    color: var(--color-text-main);
  }

  .unit {
    font-size: var(--font-size-base);
    font-weight: normal;
    color: var(--color-text-secondary);
  }

  .label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    line-height: 1;
    color: var(--color-text-secondary);
  }

  &.is-sm {
    --gauge-size: 110px;
    --gauge-stroke-width: 6;

    .value {
      font-size: var(--font-size-xl);
    }
  }

  &.is-lg {
    --gauge-size: 200px;
    --gauge-stroke-width: 10;

    .value {
      font-size: var(--font-size-4xl);
    }
  }
}
</style>
