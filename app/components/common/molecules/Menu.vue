<script setup lang="ts">
/**
 * Menu (Geist準拠)
 * [Molecules] アクション（操作・コマンド）を折りたたんで表示するドロップダウンメニュー。
 * - Geist公式仕様準拠: クリックによる展開、ウィンドウ境界に応じた自動配置、セクション/区切り線、ロック状態表示
 * - 直角（border-radius: 0）サイバーパネルと直角アイテム
 * - 支援アクセシビリティ属性（aria-*, role）は規約により除外
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import type { MenuItem, MenuProps } from '~/types/components'

const {
  items = [],
  icon = 'more-vertical',
  label,
  variant = 'secondary',
  size = 'sm',
  withChevron = false,
  disabled = false,
} = defineProps<MenuProps>()

const isOpen = ref(false)
const isMounted = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const activeIndex = ref<number>(-1)

const isUpward = ref(false)
const coords = ref({ top: 0, left: 0 })

const updatePosition = () => {
  if (!triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const offset = 4
  const estimatedMenuHeight = Math.min(items.length * 36 + 16, 320)

  const willOverflowBottom = rect.bottom + estimatedMenuHeight + offset > window.innerHeight
  const willOverflowRight = rect.right > window.innerWidth

  isUpward.value = willOverflowBottom
  coords.value = {
    top: willOverflowBottom ? rect.top - offset : rect.bottom + offset,
    left: willOverflowRight ? rect.right : rect.left,
  }
}

const open = () => {
  if (disabled || items.length === 0) return
  updatePosition()
  isOpen.value = true
  activeIndex.value = -1
}

const close = () => {
  isOpen.value = false
  activeIndex.value = -1
}

const toggle = () => {
  if (isOpen.value) {
    close()
  }
  else {
    open()
  }
}

const handleItemClick = async (item: MenuItem) => {
  if (item.disabled || item.locked) return
  close()
  if (item.action) {
    await item.action()
  }
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

const focusItem = (index: number) => {
  if (!menuRef.value) return
  const buttons = menuRef.value.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>('.menu-item:not(.is-disabled)')

  if (buttons.length > 0 && index >= 0 && index < buttons.length) {
    buttons[index]?.focus()
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value) return

  if (e.key === 'Escape') {
    close()
    triggerRef.value?.querySelector('button')?.focus()

    return
  }

  const actionableItems = items.filter(i => !i.disabled && !i.locked)

  if (actionableItems.length === 0) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % actionableItems.length
    focusItem(activeIndex.value)
  }
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = activeIndex.value <= 0 ? actionableItems.length - 1 : activeIndex.value - 1
    focusItem(activeIndex.value)
  }
  else if (e.key === 'Home') {
    e.preventDefault()
    activeIndex.value = 0
    focusItem(0)
  }
  else if (e.key === 'End') {
    e.preventDefault()
    activeIndex.value = actionableItems.length - 1
    focusItem(activeIndex.value)
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
    transform: isUpward.value ? 'translateY(-100%)' : 'none',
    zIndex: 'var(--z-index-dropdown, 1050)',
  }
})
</script>

<template>
  <div ref="triggerRef" class="menu-root relative inline-flex">
    <Tooltip text="操作メニュー" :disabled="Boolean(label || $slots.default)">
      <Button :size="size" :variant="variant" :disabled="disabled" :icon="icon" :suffix-icon="withChevron ? 'chevron-down' : undefined" @click="toggle">
        <slot>{{ label }}</slot>
      </Button>
    </Tooltip>

    <Teleport v-if="isMounted && items.length > 0" to="body">
      <Transition name="menu">
        <div v-if="isOpen" ref="menuRef" class="menu-panel" :style="menuStyle">
          <ul class="menu-list flex flex-col">
            <template v-for="(item, index) in items" :key="`${item.label}-${index}`">
              <li v-if="item.section" class="menu-section-header">
                {{ item.section }}
              </li>
              <li v-if="item.divider" class="menu-divider" />
              <li>
                <NuxtLink v-if="item.to" :to="item.to" class="menu-item flex items-center justify-between gap-inline-gap w-full text-left" :class="{ 'is-danger': item.variant === 'danger', 'is-disabled': item.disabled || item.locked }" @click="handleItemClick(item)">
                  <div class="flex items-center gap-inline-gap min-w-0 flex-1">
                    <Icon v-if="item.icon" :name="item.icon" size="sm" class="menu-item-icon" />
                    <span class="menu-item-label">{{ item.label }}</span>
                  </div>
                  <Icon v-if="item.locked" name="lock" size="sm" class="menu-item-suffix" />
                  <Icon v-else-if="item.suffixIcon" :name="item.suffixIcon" size="sm" class="menu-item-suffix" />
                </NuxtLink>

                <a v-else-if="item.href" :href="item.href" target="_blank" rel="noopener noreferrer" class="menu-item flex items-center justify-between gap-inline-gap w-full text-left" :class="{ 'is-danger': item.variant === 'danger', 'is-disabled': item.disabled || item.locked }" @click="handleItemClick(item)">
                  <div class="flex items-center gap-inline-gap min-w-0 flex-1">
                    <Icon v-if="item.icon" :name="item.icon" size="sm" class="menu-item-icon" />
                    <span class="menu-item-label">{{ item.label }}</span>
                  </div>
                  <Icon v-if="item.locked" name="lock" size="sm" class="menu-item-suffix" />
                  <Icon v-else-if="item.suffixIcon" :name="item.suffixIcon" size="sm" class="menu-item-suffix" />
                </a>

                <button v-else type="button" class="menu-item flex items-center justify-between gap-inline-gap w-full text-left" :class="{ 'is-danger': item.variant === 'danger', 'is-disabled': item.disabled || item.locked }" :disabled="item.disabled || item.locked" @click="handleItemClick(item)">
                  <div class="flex items-center gap-inline-gap min-w-0 flex-1">
                    <Icon v-if="item.icon" :name="item.icon" size="sm" class="menu-item-icon" />
                    <span class="menu-item-label">{{ item.label }}</span>
                  </div>
                  <Icon v-if="item.locked" name="lock" size="sm" class="menu-item-suffix" />
                  <Icon v-else-if="item.suffixIcon" :name="item.suffixIcon" size="sm" class="menu-item-suffix" />
                </button>
              </li>
            </template>
          </ul>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.menu-panel {
  position: fixed;

  min-width: 140px;
  max-width: 260px;
  padding: var(--space-0-5);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: 0;

  background-color: var(--surface-bg-solid);
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-elevation-md);
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity var(--duration-fast) var(--ease-base);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}

.menu-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.menu-section-header {
  user-select: none;
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.menu-divider {
  height: 1px;
  margin: var(--space-0-5) 0;
  background-color: var(--color-border-subtle);
}

.menu-item {
  padding: var(--space-1) var(--space-2);
  border: none;
  border-radius: 0;

  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-decoration: none;

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

.menu-item-label {
  white-space: nowrap;
}

.menu-item-suffix {
  color: var(--color-text-muted);
}
</style>
