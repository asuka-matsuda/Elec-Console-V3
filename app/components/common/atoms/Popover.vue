<script setup lang="ts">
/**
 * AtomsPopover
 * [Atoms] ホバーまたはタップで解説や補足情報を表示するポップオーバー・ヘルプチップコンポーネント。
 * ヘルプID（helpId）を渡すことで、ヘルプマスタ（helpConstants）からタイトルや解説を自動解決できます。
 */
import { computed, onBeforeUnmount, ref } from 'vue'

import { getHelpContent, type HelpId } from '~/constants/helpConstants'

interface Props {
  helpId?: HelpId
  text?: string
  title?: string
  placement?: 'top' | 'bottom'
  icon?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  helpId: undefined,
  text: undefined,
  title: undefined,
  placement: 'top',
  icon: 'help-circle',
  ariaLabel: 'ヘルプを表示',
})

const isOpen = ref(false)
const popoverRef = ref<HTMLElement | null>(null)

// ヘルプマスタからの自動解決
const resolvedHelp = computed(() => {
  if (props.helpId) {
    return getHelpContent(props.helpId)
  }
  return undefined
})

const displayTitle = computed(() => props.title ?? resolvedHelp.value?.title)
const displayText = computed(() => props.text ?? resolvedHelp.value?.content)
const displayReference = computed(() => resolvedHelp.value?.reference)

// ホバー＆クリック制御
let leaveTimer: ReturnType<typeof setTimeout> | null = null

const handleMouseEnter = () => {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
  isOpen.value = true
}

const handleMouseLeave = () => {
  leaveTimer = setTimeout(() => {
    isOpen.value = false
  }, 150)
}

const handleToggle = (e: MouseEvent) => {
  e.stopPropagation()
  isOpen.value = !isOpen.value
}

// 外側クリックで閉じる
const handleOutsideClick = (e: MouseEvent) => {
  if (!isOpen.value) return
  if (popoverRef.value && !popoverRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

// Escキーで閉じる
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

if (import.meta.client) {
  window.addEventListener('click', handleOutsideClick)
  window.addEventListener('keydown', handleKeydown)
}

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('click', handleOutsideClick)
    window.removeEventListener('keydown', handleKeydown)
  }
  if (leaveTimer) clearTimeout(leaveTimer)
})
</script>

<template>
  <div
    ref="popoverRef"
    class="relative inline-flex items-center text-left"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- トリガー要素 -->
    <slot name="trigger" :is-open="isOpen" :toggle="handleToggle">
      <button
        type="button"
        class="inline-flex items-center justify-center p-0.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--theme-accent)] hover:bg-[var(--color-bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)]"
        :aria-label="ariaLabel"
        :aria-expanded="isOpen"
        @click="handleToggle"
      >
        <AtomsIcon :name="icon" size="sm" />
      </button>
    </slot>

    <!-- ポップオーバー吹き出し -->
    <transition name="popover-fade">
      <div
        v-if="isOpen && (displayText || $slots.default)"
        class="popover-panel absolute z-[var(--z-index-tooltip,100)] w-64 max-w-[85vw] p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--surface-bg-elevated)] shadow-[var(--shadow-floating)] backdrop-blur-[var(--blur-md)]"
        :class="[
          placement === 'top'
            ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
            : 'top-full mt-2 left-1/2 -translate-x-1/2',
        ]"
        role="tooltip"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <!-- アロー（三角矢印） -->
        <div
          class="arrow absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border border-[var(--color-border)] bg-[var(--surface-bg-elevated)]"
          :class="[
            placement === 'top'
              ? 'bottom-[-5px] border-t-0 border-l-0'
              : 'top-[-5px] border-b-0 border-r-0',
          ]"
        />

        <!-- タイトル -->
        <div
          v-if="displayTitle"
          class="flex items-center gap-1.5 font-bold text-[var(--font-size-xs)] text-[var(--color-text-main)] mb-1 pb-1 border-b border-[var(--color-border-subtle)]"
        >
          <AtomsIcon name="info" size="sm" class="text-[var(--theme-accent)] shrink-0" />
          <span>{{ displayTitle }}</span>
        </div>

        <!-- 本文 -->
        <div class="text-[var(--font-size-xs)] leading-relaxed text-[var(--color-text-secondary)] whitespace-normal">
          <slot :help="resolvedHelp">
            {{ displayText }}
          </slot>
        </div>

        <!-- 参照規格（内線規程など） -->
        <div v-if="displayReference" class="mt-2 pt-1 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
          <span class="text-[var(--font-size-2xs)] text-[var(--color-text-muted)]">準拠規格:</span>
          <span class="inline-block px-1.5 py-0.5 text-[var(--font-size-2xs)] font-medium rounded bg-[var(--surface-bg)] text-[var(--theme-accent)] border border-[var(--color-border-subtle)]">
            {{ displayReference }}
          </span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  transform: translate(-50%, 4px);
  opacity: 0;
}
</style>
