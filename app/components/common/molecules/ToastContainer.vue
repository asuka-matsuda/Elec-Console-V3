<script setup lang="ts">
/**
 * ToastContainer
 * アプリケーション共通のトースト通知スタック表示コンポーネント。
 * - app.vue 直下に1つだけ配置され、useToast() から追加された通知を描画
 * - 現場端末でも作業を妨げない位置に固定配置され、一定時間で自動消滅
 */
import { useToast } from '~/composables/useToast'
import type { ToastType } from '~/types/components'

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
    default:
      return 'info'
  }
}
</script>

<template>
  <div class="toast-container fixed bottom-6 right-6 z-[1080] flex flex-col gap-item-gap max-w-sm w-full p-layout-pad">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast-card flex items-start gap-item-gap" :class="`is-${toast.type}`">
        <Icon :name="getToastIcon(toast.type)" class="toast-icon mt-0.5" />

        <p class="toast-message flex-1 min-w-0">
          {{ toast.message }}
        </p>

        <button type="button" class="toast-close shrink-0 inline-flex items-center justify-center" @click="remove(toast.id)">
          <Icon name="x" size="sm" />
        </button>
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

  background-color: var(--surface-bg-solid);
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-elevation-md);

  &.is-success {
    --toast-accent: var(--color-status-success);
  }

  &.is-danger {
    --toast-accent: var(--color-status-danger);
  }

  &.is-warning {
    --toast-accent: var(--color-status-warning);
  }

  &.is-info {
    --toast-accent: var(--theme-accent);
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

  color: var(--color-text-muted);

  background: transparent;

  transition: var(--transition-fast);

  @include state-interactive;

  &:hover {
    color: var(--color-text-main);
  }
}

// アニメーション (スライドイン & フェードアウト)
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
