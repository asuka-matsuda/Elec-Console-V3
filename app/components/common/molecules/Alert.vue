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
  warning: 'alert-triangle',
  danger: 'alert-circle',
}

const resolvedIcon = computed<IconName>(() => props.icon || defaultIcons[props.variant])
</script>

<template>
  <aside
    class="alert flex items-start gap-item-gap p-panel-pad-compact"
    :class="`is-${variant}`"
  >
    <Icon
      :name="resolvedIcon"
      class="alert-icon mt-0.5 shrink-0"
    />
    <div class="alert-content flex-1 min-w-0 flex flex-col gap-inline-gap">
      <strong v-if="title" class="alert-title">{{ title }}</strong>
      <div class="alert-message break-words">
        <slot />
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.alert {
  border: var(--border-width-base) solid transparent;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);

  &.is-info {
    border-color: color-mix(in srgb, var(--color-category-main) 35%, transparent);
    color: var(--color-text-main);
    background-color: color-mix(in srgb, var(--color-category-main) 10%, var(--surface-bg));

    .alert-icon {
      color: var(--color-category-main);
    }
  }

  &.is-success {
    border-color: color-mix(in srgb, var(--color-status-success) 35%, transparent);
    color: var(--color-status-success);
    background-color: color-mix(in srgb, var(--color-status-success) 10%, var(--surface-bg));

    .alert-icon {
      color: var(--color-status-success);
    }
  }

  &.is-warning {
    border-color: color-mix(in srgb, var(--color-status-warning) 35%, transparent);
    color: var(--color-status-warning);
    background-color: color-mix(in srgb, var(--color-status-warning) 10%, var(--surface-bg));

    .alert-icon {
      color: var(--color-status-warning);
    }
  }

  &.is-danger {
    border-color: color-mix(in srgb, var(--color-status-danger) 35%, transparent);
    color: var(--color-status-danger);
    background-color: color-mix(in srgb, var(--color-status-danger) 10%, var(--surface-bg));

    .alert-icon {
      color: var(--color-status-danger);
    }
  }
}

.alert-title {
  font-weight: var(--font-weight-bold);
  color: inherit;
}

.alert-message {
  color: inherit;
}
</style>
