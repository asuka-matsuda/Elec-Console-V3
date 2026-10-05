<script setup lang="ts">
/**
 * Banner
 * Geist デザインシステム準拠のバナーコンポーネント。
 * システムやプロジェクト全体の重要状態（オフライン、メンテナンス等）を画面全幅で告知します。
 */
import { computed } from 'vue'

import type { IconName } from '~/constants/icons'
import type { BannerProps, BannerVariant } from '~/types/components'

const {
  variant = 'gray',
  icon,
  title,
  sub,
  dismissible = false,
} = defineProps<BannerProps>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const defaultIcons: Record<BannerVariant, IconName> = {
  gray: 'info',
  warning: 'triangle-alert',
  success: 'circle-check',
  danger: 'circle-alert',
}

const resolvedIcon = computed(() => icon || defaultIcons[variant] || 'info')
</script>

<template>
  <div class="banner w-full flex items-center justify-between gap-item-gap py-inline-gap px-panel-pad" :class="`banner--${variant}`">
    <div class="flex items-center gap-item-gap min-w-0">
      <Icon :name="resolvedIcon" size="sm" class="banner-icon" />
      <div class="flex items-center gap-item-gap flex-wrap min-w-0">
        <strong v-if="title" class="banner-title">{{ title }}</strong>
        <span v-if="sub" class="banner-sub">{{ sub }}</span>
        <slot />
      </div>
    </div>

    <div class="flex items-center gap-item-gap shrink-0">
      <slot name="action" />

      <Tooltip v-if="dismissible" text="閉じる">
        <Button variant="tertiary" size="sm" icon="x" class="banner-close" @click="emit('close')" />
      </Tooltip>
    </div>
  </div>
</template>

<style scoped lang="scss">
.banner {
  --banner-color: var(--color-text-muted);

  border-bottom: var(--border-width-base) solid color-mix(in srgb, var(--banner-color) 40%, transparent);

  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
  color: var(--banner-color);

  background-color: color-mix(in srgb, var(--banner-color) 12%, var(--surface-bg-solid));

  &--gray {
    --banner-color: var(--color-text-muted);
  }

  &--warning {
    --banner-color: var(--color-status-warning);
  }

  &--success {
    --banner-color: var(--color-status-success);
  }

  &--danger {
    --banner-color: var(--color-status-danger);
  }

  .banner-icon {
    font-size: 1.1em;
  }

  .banner-title {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  .banner-sub {
    font-size: var(--font-size-2xs);
    opacity: 0.85;
  }

  .banner-close {
    width: 1.5em;
    height: 1.5em;
    padding: 0;
    border: none;

    color: currentcolor;

    background: transparent;
  }
}
</style>
