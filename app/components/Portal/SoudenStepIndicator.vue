<script setup lang="ts">
/**
 * SoudenStepIndicator
 * 送電試験ダッシュボード内のフェーズ遷移ステップインジケーター
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    stepNum: number
    title: string
    completed: number
    total: number
    to: string
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const isCompleted = computed(() => props.total > 0 && props.completed >= props.total)
const pct = computed(() => {
  if (props.total <= 0) return 0

  return Math.min(100, Math.round((props.completed / props.total) * 100))
})
</script>

<template>
  <li :class="['c-step-indicator__item', { 'is-completed': isCompleted, 'is-disabled': disabled }]">
    <div class="c-step-indicator__node">
      <AppIcon v-if="isCompleted" name="check" size="sm" />
      <span v-else>{{ stepNum }}</span>
    </div>

    <div class="c-step-indicator__info">
      <div class="c-step-indicator__details">
        <h4 class="c-step-indicator__title">
          {{ title }}
        </h4>
        <div class="c-step-indicator__progress">
          <strong>{{ completed }}</strong> / {{ total }}
          <span class="c-step-indicator__pct">({{ pct }}%)</span>
        </div>
      </div>

      <AppButton
        :to="to"
        :variant="isCompleted ? 'success' : 'primary'"
        size="sm"
        :disabled="disabled"
      >
        試験入力
      </AppButton>
    </div>
  </li>
</template>

<style scoped lang="scss">
.c-step-indicator__item {
  position: relative;

  display: flex;
  gap: var(--space-4, 16px);
  align-items: center;

  width: 100%;

  list-style: none;

  &::after {
    content: "";

    position: absolute;
    z-index: 1;
    top: var(--space-8, 32px);
    left: 15px;

    width: 2px;
    height: calc(100% + var(--space-4, 16px));

    background-color: rgb(255 255 255 / 10%);

    transition: background-color var(--duration-base) var(--ease-base);
  }

  &:last-child::after {
    display: none;
  }

  &.is-completed {
    .c-step-indicator__node {
      --glow-color: var(--color-status-success);

      border-color: var(--color-status-success);
      color: var(--color-status-success);
      box-shadow: var(--shadow-glow-sm);
    }

    &::after {
      background-color: var(--color-status-success, #22c55e);
    }
  }

  &.is-disabled {
    pointer-events: none;
    opacity: 0.6;
  }
}

.c-step-indicator__node {
  position: relative;
  z-index: 2;

  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;

  width: 32px;
  height: 32px;
  border: 2px solid rgb(255 255 255 / 20%);
  border-radius: 50%;

  font-family: var(--font-mono, monospace);
  font-size: var(--text-sm, 0.875rem);
  font-weight: bold;
  color: var(--color-text-muted, #94a3b8);

  background-color: var(--surface-bg-elevated, #1e293b);

  transition: var(--transition-base);
}

.c-step-indicator__info {
  display: flex;
  flex: 1;
  gap: var(--space-3, 12px);
  align-items: center;
  justify-content: space-between;

  padding: var(--space-3, 12px) var(--space-4, 16px);
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: var(--radius-md, 8px);

  background-color: rgb(255 255 255 / 3%);

  transition: border-color var(--duration-base) var(--ease-base), background-color var(--duration-base) var(--ease-base);

  &:hover {
    border-color: rgb(255 255 255 / 15%);
    background-color: rgb(255 255 255 / 5%);
  }
}

.c-step-indicator__details {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);
}

.c-step-indicator__title {
  color: var(--color-text-main);
}

.c-step-indicator__progress {
  display: inline-flex;
  gap: var(--space-1, 4px);
  align-items: baseline;

  font-family: var(--font-mono, monospace);
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-text-muted, #94a3b8);

  strong {
    color: var(--color-text-main, #fff);
  }
}

.c-step-indicator__pct {
  color: var(--color-text-secondary, #94a3b8);
}
</style>
