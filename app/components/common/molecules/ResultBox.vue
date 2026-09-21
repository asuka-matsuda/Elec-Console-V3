<script setup lang="ts">
/**
 * ResultBox
 * [Molecules] 計算ツールやサマリー画面で、主要な結果数値・ステータス（判定）を表示する特化ディスプレイ。
 * 計器風の凹みシャドウ（--shadow-sink）、等幅数値フォント、判定ステータスに応じたボーダー・テキストカラーを提供します。
 */
import { computed } from 'vue'

import type { BadgePresetId, ResultBoxProps, ResultBoxStatus } from '~/types/components'

const props = withDefaults(defineProps<ResultBoxProps>(), {
  status: 'neutral',
  isEmpty: false,
  size: 'md',
})

// isEmpty prop が指定されている場合は優先して 'empty' に解決
const resolvedStatus = computed<ResultBoxStatus>(() => {
  if (props.isEmpty) return 'empty'

  return props.status || 'neutral'
})

// バッジプリセットIDの導出（純粋に status に連動）
const BADGE_STATUS_MAP: Record<ResultBoxStatus, BadgePresetId> = {
  danger: 'status:danger',
  warning: 'status:warning',
  success: 'status:success',
  neutral: 'status:neutral',
  empty: 'status:neutral',
}
const badgeId = computed<BadgePresetId>(() => BADGE_STATUS_MAP[resolvedStatus.value] ?? 'status:neutral')
</script>

<template>
  <div
    class="result-box flex flex-1 flex-col items-center justify-center gap-1 w-full min-w-0"
    :class="[`is-${resolvedStatus}`, `is-${size}`]"
  >

    <header v-if="title || badge || $slots.title || $slots.badge" class="flex items-center justify-center gap-1.5">
      <slot name="title">
        <span>{{ title }}</span>
      </slot>
      <slot name="badge">
        <Badge v-if="badge" :id="badgeId">
          {{ badge }}
        </Badge>
      </slot>
    </header>

    <div class="value flex items-center justify-center gap-2">
      <slot name="value">
        <slot />
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.result-box {
  padding: var(--space-2) var(--space-3);
  border: var(--border-width-base) solid var(--color-border);

  background: var(--surface-bg);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-panel);

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
    letter-spacing: var(--tracking-wide);
  }

  .value {
    font-family: var(--font-mono);
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
    line-height: var(--line-height-tight);
    color: var(--color-text-main);

    :deep(small),
    :deep(.unit),
    :deep(.sep) {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-normal);
      color: var(--color-text-secondary);
    }
  }

  // ステータスカラーの一元定義
  &.is-success { --status-color: var(--color-status-success); }
  &.is-warning { --status-color: var(--color-status-warning); }
  &.is-danger  { --status-color: var(--color-status-danger); }

  &.is-success,
  &.is-warning,
  &.is-danger {
    border-color: color-mix(in srgb, var(--status-color) 40%, transparent);

    .value {
      color: var(--status-color);
    }
  }

  &.is-empty {
    opacity: 0.6;

    .value {
      color: var(--color-text-muted);
    }
  }
}
</style>
