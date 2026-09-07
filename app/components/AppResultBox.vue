<script setup lang="ts">
/**
 * AppResultBox
 * 計算ツールの主結果表示エリアの大枠（外枠・タイトル・状態表現）を提供するコンポーネントです。
 * 内部のレイアウトやメトリクスはツールごとに柔軟にスロットで構成できます。
 */
import { computed } from 'vue'

export type ResultBoxStatus
  = | 'success'
    | 'warning'
    | 'danger'
    | 'error'
    | 'default'
    | 'neutral'
    | 'empty'

const props = withDefaults(
  defineProps<{
    title?: string
    status?: ResultBoxStatus
    variant?: ResultBoxStatus
    isEmpty?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    status: 'neutral',
    isEmpty: false,
    size: 'md',
  },
)

const resolvedStatus = computed(() => {
  if (props.isEmpty) return 'empty'

  const raw = props.variant || props.status

  if (raw === 'error') return 'danger'
  if (raw === 'default') return 'neutral'

  return raw || 'neutral'
})
</script>

<template>
  <div
    class="c-result-box"
    :class="[
      `is-${resolvedStatus}`,
      `is-${size}`,
    ]"
  >
    <div v-if="title || $slots.title" class="c-result-box__label">
      <slot name="title">
        {{ title }}
      </slot>
    </div>

    <div class="c-result-box__value">
      <slot name="value">
        <slot />
      </slot>
    </div>

    <div v-if="$slots.footer" class="c-result-box__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-result-box {
  position: relative;
  z-index: 1;

  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;

  min-width: 0;
  padding: var(--space-2) var(--space-3);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
  box-shadow: var(--shadow-sink);

  transition: var(--transition-base);

  &.is-sm {
    padding: var(--space-1) var(--space-2);

    :deep(.c-result-box__val),
    :deep(.value-text) {
      font-family: var(--font-mono);
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      font-variant-numeric: tabular-nums;
    }
  }

  &__label {
    font-size: var(--font-size-2xs);
    line-height: var(--line-height-base);
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  &__value {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    justify-content: center;

    width: 100%;

    :deep(.c-result-box__val),
    :deep(.value-text) {
      font-family: var(--font-mono);
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      font-variant-numeric: tabular-nums;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: var(--space-1);
  }

  // ステータスに応じた演出
  &.is-success {
    border-color: color-mix(in srgb, var(--color-status-success) 40%, transparent);

    :deep(.c-result-box__val),
    :deep(.value-text) {
      --glow-color: var(--color-status-success);

      color: var(--color-status-success);
      text-shadow: var(--text-glow-sm);
    }
  }

  &.is-warning {
    border-color: color-mix(in srgb, var(--color-status-warning) 40%, transparent);

    :deep(.c-result-box__val),
    :deep(.value-text) {
      --glow-color: var(--color-status-warning);

      color: var(--color-status-warning);
      text-shadow: var(--text-glow-sm);
    }
  }

  &.is-danger {
    border-color: color-mix(in srgb, var(--color-status-danger) 40%, transparent);

    :deep(.c-result-box__val),
    :deep(.value-text) {
      --glow-color: var(--color-status-danger);

      color: var(--color-status-danger);
      text-shadow: var(--text-glow-sm);
    }
  }

  &.is-neutral {
    :deep(.c-result-box__val),
    :deep(.value-text) {
      color: var(--color-text-main);
    }
  }

  &.is-empty {
    opacity: 0.7;

    :deep(.c-result-box__val),
    :deep(.value-text) {
      color: var(--color-text-muted);
    }
  }
}
</style>
