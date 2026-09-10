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
  badge?: string
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

const badgeColor = computed(() => {
  if (resolvedStatus.value === 'danger') return 'var(--color-status-danger)'
  if (resolvedStatus.value === 'warning') return 'var(--color-status-warning)'

  return 'var(--color-text-muted)'
})
</script>

<template>
  <AtomsPanel
    as="div"
    class="result-box flex flex-1 flex-col items-center justify-center gap-1 w-full min-w-0"
    :class="[`is-${resolvedStatus}`, `is-${size}`]"
  >
    <!-- ラベル領域 ＋ バッジ -->
    <header v-if="title || badge || $slots.title || $slots.badge" class="flex items-center justify-center gap-1.5">
      <slot name="title">
        <span>{{ title }}</span>
      </slot>
      <slot name="badge">
        <AtomsBadge
          v-if="badge && (resolvedStatus === 'warning' || resolvedStatus === 'danger')"
          :color="badgeColor"
        >
          {{ badge }}
        </AtomsBadge>
      </slot>
    </header>

    <!-- 数値・メイン表示領域 -->
    <div class="value flex items-center justify-center gap-2">
      <slot name="value">
        <slot />
      </slot>
    </div>

    <!-- アクション領域（必要時のみ） -->
    <div v-if="$slots.actions">
      <slot name="actions" />
    </div>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.result-box {
  padding: var(--space-2) var(--space-3);
  box-shadow: var(--shadow-sink);
  transition: var(--transition-glow);

  &.is-sm {
    padding: var(--space-1) var(--space-2);

    .value {
      font-size: var(--font-size-2xl);
    }
  }

  header {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-main);
    text-shadow: none;
    letter-spacing: var(--tracking-wide);
  }

  .value {
    font-family: var(--font-mono);
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
    line-height: var(--line-height-tight);

    :deep(.unit),
    :deep(small) {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-normal);
      color: var(--color-text-secondary);
      text-shadow: none;
    }

    :deep(.sep) {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      text-shadow: none;
    }

    :deep(.not-applicable) {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-shadow: none;
    }
  }

  // ステータス共通管理（CSS変数で一括設定）
  &.is-success { --status-color: var(--color-status-success); }
  &.is-warning { --status-color: var(--color-status-warning); }
  &.is-danger  { --status-color: var(--color-status-danger); }

  &.is-success,
  &.is-warning,
  &.is-danger {
    border-color: color-mix(in srgb, var(--status-color) 40%, transparent);

    .value {
      --glow-color: var(--status-color);

      color: var(--status-color);
      text-shadow: var(--text-glow-sm);
    }
  }

  &.is-neutral .value {
    color: var(--color-text-main);
  }

  &.is-empty {
    opacity: 0.7;

    .value {
      color: var(--color-text-muted);
    }
  }
}
</style>
