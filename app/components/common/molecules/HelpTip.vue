<script setup lang="ts">
/**
 * MoleculesHelpTip
 * [Molecules] ラベル横や見出し横に配置するヘルプチップコンポーネント。
 * ヘルプID（helpId）から解説を自動取得し、Teleportで最前面に吹き出しを表示します。
 * 親コンテナの overflow: hidden や画面端による見切れを完全に防ぐ自動クランプ配置です。
 */
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

import { getHelpContent, type HelpId } from '~/constants/helpConstants'

interface Props {
  helpId?: HelpId
  text?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  helpId: undefined,
  text: undefined,
  ariaLabel: 'ヘルプを表示',
})

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const position = ref({
  top: 0,
  left: 0,
  arrowLeft: 12,
  isTopPlacement: false,
})

const resolvedHelp = computed(() => {
  if (props.helpId) {
    return getHelpContent(props.helpId)
  }

  return undefined
})

const displayText = computed(() => props.text ?? resolvedHelp.value?.content)
const displayReference = computed(() => resolvedHelp.value?.reference)

const updatePosition = () => {
  if (!triggerRef.value || !import.meta.client) return

  const rect = triggerRef.value.getBoundingClientRect()
  const tipWidth = 240 // パネルの基本幅
  const margin = 12
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  // 水平方向の位置計算（右端・左端クランプ）
  let left = rect.left - 8
  if (left + tipWidth > windowWidth - margin) {
    left = Math.max(margin, windowWidth - tipWidth - margin)
  }
  if (left < margin) {
    left = margin
  }

  // アロー（矢印）の位置: トリガーアイコンの中心を追従
  const triggerCenterX = rect.left + rect.width / 2
  const arrowLeft = Math.max(8, Math.min(tipWidth - 16, triggerCenterX - left - 4))

  // 垂直方向の位置計算（基本は下、画面下端に近い場合は上）
  const expectedHeight = 120
  const isTopPlacement = rect.bottom + expectedHeight > windowHeight - margin && rect.top > expectedHeight
  const top = isTopPlacement ? rect.top - 6 : rect.bottom + 6

  position.value = {
    top,
    left,
    arrowLeft,
    isTopPlacement,
  }
}

let leaveTimer: ReturnType<typeof setTimeout> | null = null

const show = () => {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
  updatePosition()
  isOpen.value = true
  nextTick(updatePosition)
}

const hide = () => {
  leaveTimer = setTimeout(() => {
    isOpen.value = false
  }, 120)
}

const toggle = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (isOpen.value) {
    isOpen.value = false
  }
  else {
    show()
  }
}

// スクロールやリサイズで位置調整
const handleScrollOrResize = () => {
  if (isOpen.value) {
    updatePosition()
  }
}

// 外側クリックで非表示
const handleOutsideClick = (e: MouseEvent) => {
  if (!isOpen.value) return
  const target = e.target as Node
  if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) return
  isOpen.value = false
}

if (import.meta.client) {
  window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true })
  window.addEventListener('resize', handleScrollOrResize, { passive: true })
  window.addEventListener('click', handleOutsideClick)
}

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', handleScrollOrResize, { capture: true })
    window.removeEventListener('resize', handleScrollOrResize)
    window.removeEventListener('click', handleOutsideClick)
  }
  if (leaveTimer) clearTimeout(leaveTimer)
})
</script>

<template>
  <span
    ref="triggerRef"
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

    <!-- 最前面にTeleportされる吹き出しツールチップ -->
    <Teleport to="body">
      <transition name="helptip-fade">
        <div
          v-if="isOpen && (displayText || $slots.default)"
          ref="panelRef"
          class="helptip-panel fixed z-[9999] w-[240px] p-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-xl"
          :class="[position.isTopPlacement ? '-translate-y-full' : '']"
          :style="{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }"
          role="tooltip"
          @mouseenter="show"
          @mouseleave="hide"
        >
          <!-- アロー（矢印） -->
          <div
            class="arrow absolute w-2 h-2 rotate-45 border border-[var(--color-border)] bg-[var(--surface-bg-elevated)]"
            :style="{ left: `${position.arrowLeft}px` }"
            :class="[
              position.isTopPlacement
                ? 'bottom-[-5px] border-t-0 border-l-0'
                : 'top-[-5px] border-b-0 border-r-0',
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
    </Teleport>
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
