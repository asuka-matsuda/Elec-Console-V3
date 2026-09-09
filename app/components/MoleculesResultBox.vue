<script setup lang="ts">
/**
 * MoleculesResultBox
 * [Molecules] 計算ツールやサマリー画面で、主要な結果数値・ステータス（判定）を表示するための特化ボックス。
 * AtomsPanel を土台とし、計器風の凹みシャドウ（--shadow-sink）、等幅数値フォント、判定ステータスに応じた発光演出を提供します。
 */
import { computed } from 'vue'

import type { ResultBoxStatus } from '~/types/components'

interface Props {
  title?: string
  status?: ResultBoxStatus
  variant?: ResultBoxStatus
  isEmpty?: boolean
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  status: 'neutral',
  isEmpty: false,
  size: 'md',
})

const resolvedStatus = computed(() => {
  if (props.isEmpty) return 'empty'

  const raw = props.variant || props.status

  if (raw === 'error') return 'danger'
  if (raw === 'default') return 'neutral'

  return raw || 'neutral'
})
</script>

<template>
  <AtomsPanel
    as="div"
    class="result-box flex flex-1 flex-col items-center justify-center gap-1 w-full min-w-0"
    :class="[
      `is-${resolvedStatus}`,
      `is-${size}`,
      size === 'sm' ? '!py-1 !px-2' : '!py-2 !px-3',
    ]"
  >
    <!-- ラベル領域 -->
    <div v-if="title || $slots.title" class="result-box__label">
      <slot name="title">
        {{ title }}
      </slot>
    </div>

    <!-- 数値・メイン表示領域 -->
    <div class="result-box__value flex items-center justify-center gap-2 w-full font-mono tabular-nums">
      <slot name="value">
        <slot />
      </slot>
    </div>

    <!-- アクション領域 -->
    <div v-if="$slots.actions" class="result-box__actions flex items-center justify-center">
      <slot name="actions" />
    </div>

    <!-- フッター領域 -->
    <div v-if="$slots.footer" class="result-box__footer flex items-center justify-center">
      <slot name="footer" />
    </div>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.result-box {
  box-shadow: var(--shadow-sink);
  transition: var(--transition-glow);

  &.is-sm {
    .result-box__value,
    :deep(.result-box__val),
    :deep(.value-text) {
      font-size: var(--font-size-2xl);
    }
  }

  &__label {
    font-size: var(--font-size-2xs);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
  }

  &__value {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);

    :deep(.result-box__val),
    :deep(.value-text) {
      font-family: inherit;
      font-size: inherit;
      font-weight: inherit;
      font-variant-numeric: inherit;
      color: inherit;
      text-shadow: inherit;
    }
  }

  // ステータスに応じた発光・色演出
  &.is-success {
    border-color: color-mix(in srgb, var(--color-status-success) 40%, transparent);

    .result-box__value {
      --glow-color: var(--color-status-success);

      color: var(--color-status-success);
      text-shadow: var(--text-glow-sm);
    }
  }

  &.is-warning {
    border-color: color-mix(in srgb, var(--color-status-warning) 40%, transparent);

    .result-box__value {
      --glow-color: var(--color-status-warning);

      color: var(--color-status-warning);
      text-shadow: var(--text-glow-sm);
    }
  }

  &.is-danger {
    border-color: color-mix(in srgb, var(--color-status-danger) 40%, transparent);

    .result-box__value {
      --glow-color: var(--color-status-danger);

      color: var(--color-status-danger);
      text-shadow: var(--text-glow-sm);
    }
  }

  &.is-neutral {
    .result-box__value {
      color: var(--color-text-main);
    }
  }

  &.is-empty {
    opacity: 0.7;

    .result-box__value {
      color: var(--color-text-muted);
    }
  }
}
</style>
