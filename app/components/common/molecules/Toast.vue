<script setup lang="ts">
/**
 * Toast (Geist準拠)
 * アプリケーション共通のトースト通知スタック表示コンポーネント。
 * - app.vue 直下に1つだけ配置され、useToast() から追加された通知を描画
 * - 直角（border-radius: 0）サイバーカードと状態別アクセント
 * - インラインアクションボタン（action / cancel）をサポート
 * - 支援アクセシビリティ属性（aria-*, role）は規約により除外
 */
import { useToast } from '~/composables/useToast'
import type { ToastItem, ToastType } from '~/types/components'

const { toasts, remove } = useToast()

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'check'
    case 'danger':
      return 'alert-circle'
    case 'warning':
      return 'alert-triangle'
    case 'info':
    case 'default':
    default:
      return 'info'
  }
}

const handleAction = async (toast: ToastItem) => {
  if (toast.action?.onClick) {
    await toast.action.onClick()
  }
  remove(toast.id)
}

const handleCancel = async (toast: ToastItem) => {
  if (toast.cancel?.onClick) {
    await toast.cancel.onClick()
  }
  remove(toast.id)
}
</script>

<template>
  <div class="toast-container fixed bottom-6 right-6 z-[1080] flex flex-col gap-item-gap max-w-sm w-full p-layout-pad">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast-card flex items-center justify-between gap-item-gap" :class="`is-${toast.type}`">
        <div class="flex items-center gap-inline-gap min-w-0 flex-1">
          <Icon :name="getToastIcon(toast.type)" class="toast-icon" />
          <p class="toast-message min-w-0">
            {{ toast.message }}
          </p>
        </div>

        <div class="flex items-center gap-inline-gap shrink-0">
          <Button v-if="toast.action" size="sm" variant="secondary" @click="handleAction(toast)">
            {{ toast.action.label }}
          </Button>
          <Button v-if="toast.cancel" size="sm" variant="tertiary" @click="handleCancel(toast)">
            {{ toast.cancel.label }}
          </Button>
          <button type="button" class="toast-close inline-flex items-center justify-center" @click="remove(toast.id)">
            <Icon name="x" size="sm" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">
.toast-container {
  pointer-events: none;
}

.toast-card {
  --toast-accent: var(--theme-accent);

  pointer-events: auto;

  padding: var(--space-panel-pad-compact);
  border: var(--border-width-base) solid var(--toast-accent);
  border-radius: 0;

  background-color: var(--surface-bg-solid);
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-elevation-md);

  &.is-default {
    --toast-accent: var(--color-border-subtle);
  }

  &.is-info {
    --toast-accent: var(--theme-accent);
  }

  &.is-success {
    --toast-accent: var(--color-status-success);
  }

  &.is-warning {
    --toast-accent: var(--color-status-warning);
  }

  &.is-danger {
    --toast-accent: var(--color-status-danger);
  }
}

.toast-icon {
  color: var(--toast-accent);
}

.toast-message {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-text-main);
  word-break: break-all;
  white-space: pre-wrap;
}

.toast-close {
  padding: var(--space-0-5);
  border: none;
  border-radius: 0;

  color: var(--color-text-muted);

  background: transparent;

  transition: var(--transition-fast);

  @include state-interactive;

  &:hover {
    color: var(--color-text-main);
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--duration-base) var(--ease-base);
}

.toast-enter-from {
  transform: translateY(1rem) scale(0.95);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(2rem) scale(0.95);
  opacity: 0;
}
</style>
