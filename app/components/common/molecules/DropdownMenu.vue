<script setup lang="ts">
/**
 * DropdownMenu
 * [Molecules] アクション（操作・コマンド）を折りたたんで表示するドロップダウンメニュー。
 * - フォーム入力値を選ぶ Select と異なり、クリック時に即時に関数やコマンドを実行
 * - Teleport によりテーブルセルやパネルの overflow: hidden によるクリッピングを回避
 * - ul 直下に li のみを配置するセマンティックHTML仕様に完全準拠
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import type { DropdownMenuItem, DropdownMenuProps } from '~/types/components'

const {
  items = [],
  icon = 'more-vertical',
  label,
  variant = 'secondary',
  disabled = false,
} = defineProps<DropdownMenuProps>()

const isOpen = ref(false)
const isMounted = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

const isUpward = ref(false)
const coords = ref({ top: 0, left: 0 })

const updatePosition = () => {
  if (!triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const offset = 4
  const estimatedMenuHeight = 120

  const willOverflowBottom = rect.bottom + estimatedMenuHeight + offset > window.innerHeight

  isUpward.value = willOverflowBottom
  coords.value = {
    top: willOverflowBottom ? rect.top - offset : rect.bottom + offset,
    left: rect.right,
  }
}

const open = () => {
  if (disabled || items.length === 0) return
  updatePosition()
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

const toggle = () => {
  if (isOpen.value) {
    close()
  }
  else {
    open()
  }
}

const handleItemClick = async (item: DropdownMenuItem) => {
  if (item.disabled) return
  close()
  await item.action()
}

const handleDocumentClick = (e: MouseEvent) => {
  if (!isOpen.value) return
  const target = e.target as Node | null

  if (
    triggerRef.value
    && !triggerRef.value.contains(target)
    && menuRef.value
    && !menuRef.value.contains(target)
  ) {
    close()
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value) {
    close()
  }
}

const handleScrollOrResize = () => {
  if (isOpen.value) {
    updatePosition()
  }
}

onMounted(() => {
  isMounted.value = true
  document.addEventListener('click', handleDocumentClick, true)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', handleScrollOrResize, true)
  window.addEventListener('resize', handleScrollOrResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick, true)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', handleScrollOrResize, true)
  window.removeEventListener('resize', handleScrollOrResize)
})

const menuStyle = computed(() => {
  return {
    top: `${coords.value.top}px`,
    left: `${coords.value.left}px`,
    transform: isUpward.value ? 'translate(-100%, -100%)' : 'translateX(-100%)',
    zIndex: 'var(--z-index-dropdown, 1050)',
  }
})
</script>

<template>
  <div ref="triggerRef" class="relative inline-flex">
    <Tooltip text="操作メニュー">
      <Button v-if="label || $slots.default" :icon="icon" :variant="variant" :disabled="disabled" @click="toggle">
        <slot>{{ label }}</slot>
      </Button>
      <Button v-else :icon="icon" :variant="variant" :disabled="disabled" @click="toggle" />
    </Tooltip>

    <Teleport v-if="isMounted && items.length > 0" to="body">
      <Transition name="dropdown">
        <div v-if="isOpen" ref="menuRef" class="dropdown-panel" :style="menuStyle">
          <ul class="dropdown-list flex flex-col">
            <li v-for="(item, index) in items" :key="`${item.label}-${index}`">
              <button type="button" class="dropdown-item flex items-center gap-inline-gap w-full text-left" :class="{ 'is-danger': item.variant === 'danger', 'is-disabled': item.disabled }" :disabled="item.disabled" @click="handleItemClick(item)">
                <Icon v-if="item.icon" :name="item.icon" size="sm" class="dropdown-item-icon" />
                <span class="dropdown-item-label">{{ item.label }}</span>
              </button>
            </li>
          </ul>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.dropdown-panel {
  position: fixed;

  min-width: 140px;
  max-width: 260px;
  padding: var(--space-0-5);
  border: var(--border-width-base) solid var(--color-border);

  background-color: var(--surface-bg-solid);
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-elevation-md);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--duration-fast) var(--ease-base);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
}

.dropdown-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.dropdown-item {
  padding: var(--space-1) var(--space-2);
  border: none;

  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);

  background: transparent;

  transition: var(--transition-fast);

  @include state-interactive;

  &:hover:not(:disabled) {
    color: var(--color-text-main);
    background-color: var(--color-bg-hover);
  }

  &.is-danger {
    color: var(--color-status-danger);

    &:hover:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-status-danger) 15%, transparent);
    }
  }

  &.is-disabled {
    @include state-disabled;
  }
}

.dropdown-item-label {
  white-space: nowrap;
}
</style>
