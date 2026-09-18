<script setup lang="ts">
/**
 * HelpTip
 * [Molecules] ラベル横や見出し横に配置するヘルプチップコンポーネント。
 * Teleportで最前面に表示し、Panelのpaddingやoverflowによる見切れを防止します。
 * スクロール追従、複雑なクランプ、装飾アローを排した最小限の設計です。
 */
import { onClickOutside, useEventListener } from '@vueuse/core'
import { computed, ref } from 'vue'

import { getHelpContent } from '~/constants/helpConstants'
import type { HelpTipProps } from '~/types/components'

const props = withDefaults(defineProps<HelpTipProps>(), {
  helpId: undefined,
  text: undefined,
})

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const position = ref({ top: 0, left: 0 })

const resolvedHelp = computed(() => (props.helpId ? getHelpContent(props.helpId) : undefined))
const displayText = computed(() => props.text ?? resolvedHelp.value?.content)
const displayReference = computed(() => resolvedHelp.value?.reference)

// 表示位置の決定（アイコン直下に展開、画面右端のみ1行でクランプ）
const updatePosition = () => {
  if (!triggerRef.value || !import.meta.client) return
  const rect = triggerRef.value.getBoundingClientRect()

  position.value = {
    top: rect.bottom + 6,
    left: Math.min(Math.max(8, rect.left - 10), window.innerWidth - 230),
  }
}

const toggle = (e: MouseEvent) => {
  e.stopPropagation()
  if (isOpen.value) {
    isOpen.value = false
  }
  else {
    updatePosition()
    isOpen.value = true
  }
}

const close = () => {
  isOpen.value = false
}

// 外側クリックで閉じる（VueUseで1行化）
onClickOutside(panelRef, (e) => {
  if (triggerRef.value?.contains(e.target as Node)) return
  close()
})

// スクロールされたら潔く閉じる（追従計算をゼロにする引き算の設計）
if (import.meta.client) {
  useEventListener(window, 'scroll', close, { capture: true, passive: true })
}
</script>

<template>
  <!-- トリガーアイコン -->
  <button
    ref="triggerRef"
    type="button"
    class="helptip-trigger inline-flex items-center justify-center p-0"
    @click="toggle"
  >
    <Icon name="help-circle" />
  </button>

  <!-- 最前面にTeleport（Panelのpadding/overflowを確実に回避） -->
  <Teleport to="body">
    <div
      v-if="isOpen && (displayText || $slots.default)"
      ref="panelRef"
      class="helptip-panel fixed z-[9999] w-[200px] px-2.5 py-2 whitespace-normal"
      :style="{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }"
    >
      <!-- 本文 -->
      <slot :help="resolvedHelp">
        {{ displayText }}
      </slot>

      <!-- 規格バッジ（共通Badgeアトムを再利用） -->
      <div
        v-if="displayReference"
        class="helptip-reference mt-1.5 pt-1 flex items-center justify-between"
      >
        <span>規格:</span>
        <Badge color="var(--theme-accent)">
          {{ displayReference }}
        </Badge>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.helptip-trigger {
  cursor: pointer;

  width: 1.1em;
  height: 1.1em;

  color: var(--color-text-muted);

  transition: var(--transition-colors);

  &:hover {
    color: var(--theme-accent);
  }
}

.helptip-panel {
  border: var(--border-width-base) solid var(--color-border);

  font-size: var(--font-size-2xs);
  line-height: var(--line-height-tight);
  color: var(--color-text-secondary);

  background-color: color-mix(in srgb, var(--color-main-bg) 94%, black);
  backdrop-filter: blur(var(--blur-sm));
  box-shadow: var(--shadow-elevation-md);
}

.helptip-reference {
  border-top: var(--border-width-base) solid var(--color-border-subtle);
  color: var(--color-text-muted);
}
</style>
