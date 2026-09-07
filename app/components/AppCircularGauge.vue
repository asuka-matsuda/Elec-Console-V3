<script setup lang="ts">
/**
 * AppCircularGauge
 * 送電試験などの進捗率を表現する円形プログレスゲージコンポーネント
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    label?: string
    size?: 'sm' | 'md' | 'lg'
    variant?: 'main' | 'tool' | 'management' | 'success' | 'warning' | 'danger'
  }>(),
  {
    size: 'md',
    variant: 'main',
  },
)

const normalizedValue = computed(() => {
  if (isNaN(props.value)) return 0

  return Math.min(100, Math.max(0, Math.round(props.value)))
})

const gaugeClasses = computed(() => [
  'c-circular-gauge',
  `c-circular-gauge--${props.size}`,
  `c-circular-gauge--${props.variant}`,
])
</script>

<template>
  <div
    :class="gaugeClasses"
    :style="{ '--progress': `${normalizedValue}%` }"
  >
    <div class="c-circular-gauge__value">
      {{ normalizedValue }}<span class="c-circular-gauge__unit">%</span>
    </div>
    <div v-if="label" class="c-circular-gauge__label">
      {{ label }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-circular-gauge {
  --gauge-color: var(--color-category-main, #3b82f6);
  --gauge-size: 160px;
  --gauge-thickness: 8px;

  position: relative;

  display: flex;
  flex-direction: column;
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
    filter: drop-shadow(0 0 10px rgb(59 130 246 / 50%));

    mask: radial-gradient(
      circle at center,
      transparent calc(50% - var(--gauge-thickness)),
      black calc(50% - var(--gauge-thickness) + 0.5px)
    );
  }

  &__value {
    position: relative;
    z-index: 2;

    font-family: var(--font-mono, monospace);
    font-size: var(--text-3xl, 1.875rem);
    font-weight: var(--font-weight-bold, 700);
    line-height: 1;
    color: var(--color-text-main, #fff);
  }

  &__unit {
    margin-left: var(--space-1, 4px);
    font-size: var(--text-base, 1rem);
    font-weight: normal;
    color: var(--color-text-secondary, #94a3b8);
  }

  &__label {
    position: relative;
    z-index: 2;

    margin-top: var(--space-2, 8px);

    font-size: var(--text-xs, 0.75rem);
    font-weight: var(--font-weight-medium, 500);
    color: var(--color-text-secondary);
  }

  &--sm {
    --gauge-size: 110px;
    --gauge-thickness: 6px;

    .c-circular-gauge__value {
      font-size: var(--text-xl, 1.25rem);
    }
  }

  &--lg {
    --gauge-size: 200px;
    --gauge-thickness: 12px;

    .c-circular-gauge__value {
      font-size: var(--text-4xl, 2.5rem);
    }
  }

  &--tool {
    --gauge-color: var(--color-category-tool, #0ea5e9);
  }

  &--management {
    --gauge-color: var(--color-category-management, #10b981);
  }

  &--success {
    --gauge-color: var(--color-status-success, #22c55e);
  }

  &--warning {
    --gauge-color: var(--color-status-warning, #f59e0b);
  }

  &--danger {
    --gauge-color: var(--color-status-danger, #ef4444);
  }
}
</style>
