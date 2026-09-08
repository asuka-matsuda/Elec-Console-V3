<script setup lang="ts">
/**
 * AtomsCircularGauge
 * [Atoms] 送電試験などの進捗率を表現する円形プログレスゲージコンポーネント
 */
import { computed } from 'vue'

const {
  value = 0,
  label,
  size = 'md',
  color = 'var(--theme-accent, var(--color-category-main))',
} = defineProps<{
  value?: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}>()

const normalizedValue = computed(() => {
  if (isNaN(value)) return 0

  return Math.min(100, Math.max(0, Math.round(value)))
})
</script>

<template>
  <div
    class="relative flex flex-col items-center justify-center gap-1 rounded-full circular-gauge"
    :class="`is-${size}`"
    :style="{
      '--progress': `${normalizedValue}%`,
      '--gauge-color': color,
      '--glow-color': color,
    }"
  >
    <div class="relative inline-flex items-baseline gap-1 value">
      {{ normalizedValue }}<span class="unit">%</span>
    </div>
    <span v-if="label" class="relative label">
      {{ label }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.circular-gauge {
  --gauge-size: 160px;
  --gauge-thickness: 8px;
  --gauge-glow: var(--drop-shadow-glow);

  width: var(--gauge-size);
  height: var(--gauge-size);

  &::before {
    content: "";

    position: absolute;
    z-index: 1;
    inset: 0;

    border-radius: 50%;

    background: conic-gradient(
      var(--gauge-color) var(--progress, 0%),
      var(--color-track-bg) 0
    );
    filter: var(--gauge-glow);

    mask: radial-gradient(
      circle at center,
      transparent calc(50% - var(--gauge-thickness)),
      black calc(50% - var(--gauge-thickness) + 0.5px)
    );
  }

  .value {
    z-index: 2;

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
    z-index: 2;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
  }

  &.is-sm {
    --gauge-size: 110px;
    --gauge-thickness: 6px;
    --gauge-glow: var(--drop-shadow-glow-sm);

    .value {
      font-size: var(--font-size-xl);
    }
  }

  &.is-lg {
    --gauge-size: 200px;
    --gauge-thickness: 12px;
    --gauge-glow: var(--drop-shadow-glow-lg);

    .value {
      font-size: var(--font-size-4xl);
    }
  }
}
</style>
