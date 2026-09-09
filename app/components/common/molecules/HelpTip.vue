<script setup lang="ts">
/**
 * MoleculesHelpTip
 * [Molecules] ラベル横や見出し横に配置するヘルプチップコンポーネント。
 * ヘルプID（helpId）から解説を自動取得し、下向きのコンパクトな吹き出しでスマートに表示します。
 */
import { computed, ref } from 'vue'

import { getHelpContent, type HelpId } from '~/constants/helpConstants'

interface Props {
  helpId?: HelpId
  text?: string
  placement?: 'bottom' | 'top'
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  helpId: undefined,
  text: undefined,
  placement: 'bottom',
  ariaLabel: 'ヘルプを表示',
})

const isOpen = ref(false)

const resolvedHelp = computed(() => {
  if (props.helpId) {
    return getHelpContent(props.helpId)
  }
  return undefined
})

const displayText = computed(() => props.text ?? resolvedHelp.value?.content)
const displayReference = computed(() => resolvedHelp.value?.reference)

const show = () => {
  isOpen.value = true
}

const hide = () => {
  isOpen.value = false
}

const toggle = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isOpen.value = !isOpen.value
}
</script>

<template>
  <span
    class="relative inline-flex items-center text-left leading-none"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <!-- トリガーアイコンボタン -->
    <button
      type="button"
      class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[var(--color-text-muted)] hover:text-[var(--theme-accent)] hover:bg-[var(--color-bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)] cursor-pointer"
      :aria-label="ariaLabel"
      :aria-expanded="isOpen"
      tabindex="0"
      @click="toggle"
    >
      <AtomsIcon name="help-circle" size="sm" class="w-3.5 h-3.5" />
    </button>

    <!-- 吹き出しツールチップ（下向き展開） -->
    <transition name="helptip-fade">
      <div
        v-if="isOpen && (displayText || $slots.default)"
        class="helptip-panel absolute z-50 w-60 p-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-xl"
        :class="[
          placement === 'bottom'
            ? 'top-full mt-1.5 left-0'
            : 'bottom-full mb-1.5 left-0',
        ]"
        role="tooltip"
      >
        <!-- アロー（矢印） -->
        <div
          class="arrow absolute left-2 w-2 h-2 rotate-45 border border-[var(--color-border)] bg-[var(--surface-bg-elevated)]"
          :class="[
            placement === 'bottom'
              ? 'top-[-5px] border-b-0 border-r-0'
              : 'bottom-[-5px] border-t-0 border-l-0',
          ]"
        />

        <!-- 解説本文 -->
        <div class="text-[var(--font-size-xs)] leading-normal text-[var(--color-text-main)] font-normal whitespace-normal">
          <slot :help="resolvedHelp">
            {{ displayText }}
          </slot>
        </div>

        <!-- 準拠規格バッジ -->
        <div
          v-if="displayReference"
          class="mt-1.5 pt-1 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[var(--font-size-2xs)]"
        >
          <span class="text-[var(--color-text-muted)] font-normal">規格:</span>
          <span class="font-medium text-[var(--theme-accent)]">
            {{ displayReference }}
          </span>
        </div>
      </div>
    </transition>
  </span>
</template>

<style scoped lang="scss">
.helptip-panel {
  background-color: var(--surface-bg-elevated);
  backdrop-filter: blur(var(--blur-md));
}

.helptip-fade-enter-active,
.helptip-fade-leave-active {
  transition: transform var(--transition-fast), opacity var(--transition-fast);
}

.helptip-fade-enter-from,
.helptip-fade-leave-to {
  transform: translateY(-2px);
  opacity: 0;
}
</style>
