<script setup lang="ts">
/**
 * Note (Geist準拠)
 * [Molecules] フィールド、カード、セクションに隣接してコンテキスト情報や警告を表示するインライン通知。
 * - Geist公式仕様準拠: 永続的（前提状態の変化まで表示）、4大バリアント、fillスタイル、単一インラインCTA
 * - 直角（border-radius: 0）サイバーサーフェス
 * - 支援アクセシビリティ属性（aria-*, role）はプロジェクト規約により除外
 */
import { computed } from 'vue'

import type { IconName } from '~/constants/icons'
import type { NoteProps } from '~/types/components'

const {
  variant = 'secondary',
  icon,
  title,
  text,
  fill = false,
  action,
} = defineProps<NoteProps>()

const defaultIcons: Record<string, IconName> = {
  secondary: 'info',
  info: 'info',
  default: 'info',
  success: 'check',
  warning: 'alert-triangle',
  error: 'alert-circle',
  danger: 'alert-circle',
}

const resolvedIcon = computed<IconName>(() => icon || defaultIcons[variant] || 'info')

const normalizedVariant = computed(() => {
  if (variant === 'danger') return 'error'
  if (variant === 'default' || variant === 'info') return 'secondary'

  return variant
})
</script>

<template>
  <div class="note flex items-start justify-between gap-item-gap" :class="[`is-${normalizedVariant}`, { 'is-fill': fill }]">
    <div class="flex items-start gap-inline-gap min-w-0 flex-1">
      <Icon :name="resolvedIcon" :spin="resolvedIcon === 'loader'" class="note-icon mt-0.5" />
      <div class="note-body min-w-0 flex-1 flex flex-col gap-0.5">
        <strong v-if="title || $slots.title" class="note-title">
          <slot name="title">{{ title }}</slot>
        </strong>
        <div v-if="text || $slots.default" class="note-message">
          <slot>{{ text }}</slot>
        </div>
      </div>
    </div>

    <div v-if="action || $slots.action" class="note-action shrink-0">
      <slot name="action">
        <Button v-if="action" size="sm" variant="secondary" @click="action.onClick">
          {{ action.label }}
        </Button>
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.note {
  --note-accent: var(--color-border-subtle);
  --note-text: var(--color-text-main);
  --note-bg: var(--surface-bg-solid);

  padding: var(--space-panel-pad-compact);
  border: var(--border-width-base) solid var(--note-accent);
  border-radius: 0;
  background-color: var(--note-bg);

  &.is-secondary {
    --note-accent: var(--color-border);
    --note-text: var(--color-text-main);
    --note-bg: var(--surface-bg-solid);

    &.is-fill {
      --note-bg: var(--surface-bg-elevated);
    }
  }

  &.is-success {
    --note-accent: var(--color-status-success);
    --note-text: var(--color-status-success);
    --note-bg: color-mix(in srgb, var(--color-status-success) 8%, var(--surface-bg-solid));

    &.is-fill {
      --note-bg: color-mix(in srgb, var(--color-status-success) 16%, var(--surface-bg-solid));
    }
  }

  &.is-warning {
    --note-accent: var(--color-status-warning);
    --note-text: var(--color-status-warning);
    --note-bg: color-mix(in srgb, var(--color-status-warning) 8%, var(--surface-bg-solid));

    &.is-fill {
      --note-bg: color-mix(in srgb, var(--color-status-warning) 16%, var(--surface-bg-solid));
    }
  }

  &.is-error {
    --note-accent: var(--color-status-danger);
    --note-text: var(--color-status-danger);
    --note-bg: color-mix(in srgb, var(--color-status-danger) 8%, var(--surface-bg-solid));

    &.is-fill {
      --note-bg: color-mix(in srgb, var(--color-status-danger) 16%, var(--surface-bg-solid));
    }
  }
}

.note-icon {
  color: var(--note-accent);
}

.note-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--note-text);
}

.note-message {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-ui);
  color: var(--note-text);
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
