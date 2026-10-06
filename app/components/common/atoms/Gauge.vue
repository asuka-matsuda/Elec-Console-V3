<script setup lang="ts">
import { computed } from 'vue'

import type { GaugeProps } from '~/types/components'
import { calcCircleProgress } from '~/utils/progress'

const props = withDefaults(defineProps<GaugeProps>(), {
  value: 0,
  min: 0,
  max: 100,
  size: 'md',
  showValue: true,
})

const RADIUS = 42

const gauge = computed(() => calcCircleProgress(props.value, RADIUS, props.min, props.max))

const resolvedColor = computed(() => {
  if (props.color) return props.color

  if (props.variant === 'success') return 'var(--color-status-success)'
  if (props.variant === 'warning') return 'var(--color-status-warning)'
  if (props.variant === 'danger') return 'var(--color-status-danger)'
  if (props.variant === 'default') return 'var(--theme-accent)'

  // デフォルトの Geist カラースケール
  const pct = gauge.value.value

  if (pct < 60) return 'var(--theme-accent)'
  if (pct < 90) return 'var(--color-status-warning)'

  return 'var(--color-status-success)'
})

const shouldShowText = computed(() => {
  return props.showValue && props.size !== 'tiny'
})
</script>

<template>
  <div class="gauge relative inline-flex flex-col items-center justify-center" :class="[`is-${size}`, { 'has-label': Boolean(label) }]" :style="{ '--gauge-fg': resolvedColor }">
    <svg class="gauge-svg" viewBox="0 0 100 100">
      <circle class="gauge-track" cx="50" cy="50" :r="RADIUS" />
      <circle class="gauge-fill" cx="50" cy="50" :r="RADIUS" :style="{ strokeDasharray: gauge.circumference, strokeDashoffset: gauge.strokeDashoffset, opacity: gauge.value === 0 ? 0 : 1 }" />
    </svg>

    <div v-if="shouldShowText" class="gauge-content absolute inset-0 flex flex-col items-center justify-center">
      <span class="gauge-value flex items-baseline">
        <span class="gauge-number">{{ gauge.value }}</span>
        <span v-if="size !== 'sm'" class="gauge-unit">%</span>
      </span>
      <span v-if="label && (size === 'md' || size === 'lg')" class="gauge-label">{{ label }}</span>
    </div>

    <span v-if="label && (size === 'tiny' || size === 'sm')" class="gauge-sublabel">{{ label }}</span>
  </div>
</template>

<style scoped lang="scss">
.gauge {

  --gauge-dimension: 80px;
  --gauge-stroke: 6;

  user-select: none;
  width: var(--gauge-dimension);
  height: var(--gauge-dimension);
  border-radius: 0;

  .gauge-svg {
    transform: rotate(-90deg);
    width: 100%;
    height: 100%;
  }

  .gauge-track {
    fill: none;
    stroke: var(--color-track-bg);
    stroke-width: var(--gauge-stroke);
  }

  .gauge-fill {
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--gauge-fg) 35%, transparent));

    fill: none;
    stroke: var(--gauge-fg);
    stroke-linecap: round;
    stroke-width: var(--gauge-stroke);

    transition: stroke-dashoffset var(--duration-slow) var(--ease-out), opacity var(--duration-fast) var(--ease-out);
  }

  .gauge-content {
    pointer-events: none;
  }

  .gauge-value {
    font-family: var(--font-mono);
    font-weight: var(--font-weight-bold);
    line-height: 1;
    color: var(--color-text-main);
  }

  .gauge-number {
    font-size: var(--font-size-xl);
  }

  .gauge-unit {
    margin-inline-start: var(--space-0-5);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-normal);
    color: var(--color-text-secondary);
  }

  .gauge-label {
    overflow: hidden;

    max-width: 80%;
    margin-top: var(--space-1);

    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    line-height: 1;
    color: var(--color-text-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .gauge-sublabel {
    margin-top: var(--space-1);

    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  &.is-tiny {
    --gauge-dimension: 24px;
    --gauge-stroke: 10;
  }

  &.is-sm {
    --gauge-dimension: 48px;
    --gauge-stroke: 8;

    .gauge-number {
      font-size: var(--font-size-xs);
    }
  }

  &.is-md {
    --gauge-dimension: 80px;
    --gauge-stroke: 6;

    .gauge-number {
      font-size: var(--font-size-xl);
    }
  }

  &.is-lg {
    --gauge-dimension: 140px;
    --gauge-stroke: 5;

    .gauge-number {
      font-size: var(--font-size-4xl);
    }

    .gauge-unit {
      font-size: var(--font-size-base);
    }

    .gauge-label {
      margin-top: var(--space-2);
      font-size: var(--font-size-sm);
    }
  }
}
</style>
