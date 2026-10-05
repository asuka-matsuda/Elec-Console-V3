<script setup lang="ts">
/**
 * Alert
 * [Common Molecules] 警告、成功、情報、エラー等の通知メッセージを表示するバナーコンポーネント。
 */
import { computed } from 'vue'

import type { IconName } from '~/constants/icons'
import type { AlertProps, AlertVariant } from '~/types/components'

const props = withDefaults(
  defineProps<AlertProps>(),
  {
    variant: 'info',
  },
)

const defaultIcons: Record<AlertVariant, IconName> = {
  info: 'info',
  success: 'check',
  warning: 'triangle-alert',
  danger: 'circle-alert',
}

const resolvedIcon = computed<IconName>(() => props.icon || defaultIcons[props.variant])
</script>

<template>
  <div class="alert flex items-start gap-item-gap p-panel-pad-compact" :class="`is-${variant}`">
    <Icon :name="resolvedIcon" :spin="resolvedIcon === 'loader'" class="alert-icon mt-0.5" />
    <div class="flex-1 min-w-0 flex flex-col gap-inline-gap">
      <strong v-if="title" class="alert-title">{{ title }}</strong>
      <div v-if="text || $slots.default" class="alert-message break-words">
        <slot>{{ text }}</slot>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.alert {
  --alert-color: var(--color-category-main);
  --alert-text-color: var(--alert-color);

  border: var(--border-width-base) solid color-mix(in srgb, var(--alert-color) 35%, transparent);

  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--alert-text-color);

  background-color: color-mix(in srgb, var(--alert-color) 10%, var(--surface-bg));

  .alert-icon {
    color: var(--alert-color);
  }

  .alert-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: inherit;
  }

  .alert-message {
    font-size: var(--font-size-xs);
    line-height: var(--line-height-ui);
    color: inherit;
  }

  &.is-info {
    --alert-color: var(--color-category-main);
    --alert-text-color: var(--color-text-main);
  }

  &.is-success {
    --alert-color: var(--color-status-success);
  }

  &.is-warning {
    --alert-color: var(--color-status-warning);
  }

  &.is-danger {
    --alert-color: var(--color-status-danger);
  }
}
</style>
