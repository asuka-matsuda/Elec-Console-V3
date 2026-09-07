<script setup lang="ts">
/**
 * AppCircularGauge
 * 送電試験などの進捗率を表現する円形プログレスゲージコンポーネント
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
    class="c-circular-gauge"
    :class="`is-${size}`"
    :style="{
      '--progress': `${normalizedValue}%`,
      '--gauge-color': color,
      '--glow-color': color,
    }"
  >
    <div class="value">
      {{ normalizedValue }}<span class="unit">%</span>
    </div>
    <span v-if="label" class="label">
      {{ label }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.c-circular-gauge {
  --gauge-size: 160px;
  --gauge-thickness: 8px;
  --gauge-glow: var(--drop-shadow-glow);

  position: relative;

  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;

  width: var(--gauge-size);
  height: var(--gauge-size);
  border-radius: 50%;

  &::before {
    content: "";

    position: absolute;
    z-index: 1;
    inset: 0;

    border-radius: 50%;

    background: conic-gradient(
      var(--gauge-color) var(--progress, 0%),
      rgb(255 255 255 / 8%) 0
    );
    filter: var(--gauge-glow);

    mask: radial-gradient(
      circle at center,
      transparent calc(50% - var(--gauge-thickness)),
      black calc(50% - var(--gauge-thickness) + 0.5px)
    );
  }

  .value {
    position: relative;
    z-index: 2;

    display: inline-flex;
    gap: var(--space-1);
    align-items: baseline;

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
    position: relative;
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
