<script setup lang="ts">
/**
 * AppProgressBar
 * 各試験フェーズや系統の進捗バーコンポーネント
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    completed: number
    total: number
    excluded?: number
    pct?: number
    variant?: 'main' | 'tool' | 'management' | 'success' | 'warning'
  }>(),
  {
    excluded: 0,
    variant: 'management',
  },
)

const calculatedPct = computed(() => {
  if (props.pct !== undefined) return Math.min(100, Math.max(0, props.pct))
  if (props.total <= 0) return 0

  return Math.min(100, Math.max(0, Math.round((props.completed / props.total) * 100)))
})
</script>

<template>
  <div class="c-progress-wrap">
    <div class="c-progress-wrap__header">
      <span class="c-progress-wrap__label">{{ label }}</span>
      <div class="c-progress-wrap__meta">
        <span class="c-progress-wrap__count">
          <strong>{{ completed }}</strong> / {{ total }}
        </span>
        <span class="c-progress-wrap__pct">
          ({{ calculatedPct }}<span class="c-progress-wrap__unit">%</span>)
        </span>
        <span v-if="excluded && excluded > 0" class="c-progress-wrap__note">
          (除外: {{ excluded }})
        </span>
      </div>
    </div>

    <div class="c-progress-bar">
      <div
        :class="['c-progress-bar__fill', `c-progress-bar__fill--${variant}`]"
        :style="{ width: `${calculatedPct}%` }"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-progress-wrap {
  @include flex-start-stretch($direction: column);

  gap: var(--space-1, 4px);
  width: 100%;

  &__header {
    @include flex-between-center;

    font-size: var(--text-xs, 0.75rem);
  }

  &__label {
    font-weight: var(--font-weight-medium, 500);
    color: var(--color-text-main, #fff);
  }

  &__meta {
    @include flex-end-center;

    gap: var(--space-2, 8px);
    font-family: var(--font-mono, monospace);
    color: var(--color-text-muted, #64748b);
  }

  &__count {
    strong {
      color: var(--color-text-main, #fff);
    }
  }

  &__pct {
    color: var(--color-text-main, #fff);
  }

  &__unit {
    color: var(--color-text-secondary, #94a3b8);
  }

  &__note {
    font-size: 10px;
    color: var(--color-text-muted, #64748b);
  }
}

.c-progress-bar {
  overflow: hidden;

  width: 100%;
  height: 8px;
  border-radius: var(--radius-full, 9999px);

  background-color: rgb(255 255 255 / 8%);

  &__fill {
    height: 100%;
    border-radius: var(--radius-full, 9999px);

    background: linear-gradient(90deg, #10b981, #34d399);
    box-shadow: 0 0 8px rgb(16 185 129 / 50%);

    transition: width 0.4s ease-out;

    &--main {
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      box-shadow: 0 0 8px rgb(59 130 246 / 50%);
    }

    &--tool {
      background: linear-gradient(90deg, #0ea5e9, #38bdf8);
      box-shadow: 0 0 8px rgb(14 165 233 / 50%);
    }

    &--success {
      background: linear-gradient(90deg, #22c55e, #4ade80);
      box-shadow: 0 0 8px rgb(34 197 94 / 50%);
    }

    &--warning {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
      box-shadow: 0 0 8px rgb(245 158 11 / 50%);
    }
  }
}
</style>
