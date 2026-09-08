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
  <div class="progress-wrap">
    <div class="progress-wrap__header">
      <span class="progress-wrap__label">{{ label }}</span>
      <div class="progress-wrap__meta">
        <span class="progress-wrap__count">
          <strong>{{ completed }}</strong> / {{ total }}
        </span>
        <span class="progress-wrap__pct">
          ({{ calculatedPct }}<span class="progress-wrap__unit">%</span>)
        </span>
        <span v-if="excluded && excluded > 0" class="progress-wrap__note">
          (除外: {{ excluded }})
        </span>
      </div>
    </div>

    <div class="progress-bar">
      <div
        :class="['progress-bar__fill', `progress-bar__fill--${variant}`]"
        :style="{ width: `${calculatedPct}%` }"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.progress-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);
  width: 100%;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--text-xs, 0.75rem);
  }

  &__label {
    font-weight: var(--font-weight-medium, 500);
    color: var(--color-text-main);
  }

  &__meta {
    display: flex;
    gap: var(--space-2, 8px);
    align-items: center;
    justify-content: flex-end;

    font-family: var(--font-mono, monospace);
    color: var(--color-text-muted);
  }

  &__count {
    strong {
      color: var(--color-text-main);
    }
  }

  &__pct {
    color: var(--color-text-main);
  }

  &__unit {
    color: var(--color-text-secondary);
  }

  &__note {
    font-size: 10px;
    color: var(--color-text-muted);
  }
}

.progress-bar {
  overflow: hidden;

  width: 100%;
  height: 8px;
  border-radius: var(--radius-full);

  background-color: var(--color-track-bg);

  &__fill {
    --glow-color: var(--color-status-success);

    height: 100%;
    border-radius: var(--radius-full);

    background: linear-gradient(90deg, var(--color-status-success), color-mix(in srgb, var(--color-status-success) 85%, var(--color-overlay)));
    box-shadow: var(--shadow-glow-sm);

    transition: width var(--duration-slow) var(--ease-out);

    &--main {
      --glow-color: var(--color-category-main);

      background: linear-gradient(90deg, var(--color-category-main), color-mix(in srgb, var(--color-category-main) 85%, var(--color-overlay)));
      box-shadow: var(--shadow-glow-sm);
    }

    &--tool {
      --glow-color: var(--color-category-tool);

      background: linear-gradient(90deg, var(--color-category-tool), color-mix(in srgb, var(--color-category-tool) 85%, var(--color-overlay)));
      box-shadow: var(--shadow-glow-sm);
    }

    &--success {
      --glow-color: var(--color-status-success);

      background: linear-gradient(90deg, var(--color-status-success), color-mix(in srgb, var(--color-status-success) 85%, var(--color-overlay)));
      box-shadow: var(--shadow-glow-sm);
    }

    &--warning {
      --glow-color: var(--color-status-warning);

      background: linear-gradient(90deg, var(--color-status-warning), color-mix(in srgb, var(--color-status-warning) 85%, var(--color-overlay)));
      box-shadow: var(--shadow-glow-sm);
    }
  }
}
</style>
