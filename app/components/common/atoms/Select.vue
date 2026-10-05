<script setup lang="ts" generic="T extends string | number | boolean = string | number | boolean">
/**
 * Select
 * Geist デザインシステム準拠のドロップダウンセレクトコンポーネント（Atoms）。
 * - 3段階のサイズ展開（sm: 32px, md: 40px [デフォルト], lg: 48px）
 * - 前置アイコンおよび前置ラベル（icon / prefix）
 * - 選択中オプションのチェックインジケータ（Geist仕様）
 * - 完全直角規約（border-radius: 0）およびフォーカス発光トークン
 */
import { computed, onMounted, onUnmounted, ref, useId } from 'vue'

import type { SelectOption, SelectProps } from '~/types/components'

const model = defineModel<T | null>()

const {
  id,
  name,
  options = [],
  placeholder = '',
  size = 'md',
  icon,
  prefix,
  block = false,
  disabled = false,
  error = false,
  title,
} = defineProps<SelectProps<T>>()

const emit = defineEmits<{
  change: [value: T | null]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const defaultId = useId()
const selectId = computed(() => id || defaultId)

const triggerRef = ref<HTMLButtonElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

// フローティング配置座標（上下自動反転 Flip）
const dropdownPlacement = ref<'bottom' | 'top'>('bottom')
const dropdownPos = ref({ top: '', bottom: '', left: '', minWidth: '' })

const updatePosition = () => {
  if (!triggerRef.value || typeof window === 'undefined') return

  const rect = triggerRef.value.getBoundingClientRect()

  // トリガーが画面外にスクロールアウトした場合は自動的に閉じる
  if (isOpen.value && (rect.bottom < 0 || rect.top > window.innerHeight)) {
    closeDropdown()

    return
  }

  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const maxDropdownHeight = 220

  // 下スペースが不足し、上スペースの方が広い場合は上向きに反転（見切れ防止）
  const isTop = spaceBelow < maxDropdownHeight && spaceAbove > spaceBelow

  dropdownPlacement.value = isTop ? 'top' : 'bottom'

  dropdownPos.value = {
    top: isTop ? '' : `${rect.bottom + 4}px`,
    bottom: isTop ? `${window.innerHeight - rect.top + 4}px` : '',
    left: `${rect.left}px`,
    minWidth: `${rect.width}px`,
  }
}

const toggleDropdown = () => {
  if (disabled) return

  if (isOpen.value) {
    closeDropdown()
  }
  else {
    openDropdown()
  }
}

const openDropdown = () => {
  isOpen.value = true
  updatePosition()
  if (dropdownRef.value?.showPopover) {
    try {
      dropdownRef.value.showPopover()
    }
    catch {
      // 既に開いている場合の安全ガード
    }
  }
}

const closeDropdown = () => {
  isOpen.value = false
  if (dropdownRef.value?.hidePopover) {
    try {
      dropdownRef.value.hidePopover()
    }
    catch {
      // 既に閉じている場合の安全ガード
    }
  }
}

// Popover API の標準開閉イベント（Light Dismiss や Esc キーによるクローズ）と同期
const onPopoverToggle = (e: Event) => {
  const toggleEvent = e as ToggleEvent

  isOpen.value = toggleEvent.newState === 'open'
  if (isOpen.value) {
    updatePosition()
  }
}

const selectOption = (option: SelectOption<T>) => {
  if (option.disabled) return
  model.value = option.value
  emit('change', option.value)
  closeDropdown()
  triggerRef.value?.focus()
}

const handleKeydown = (e: KeyboardEvent) => {
  if (disabled) return

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (!isOpen.value) {
      openDropdown()
    }
  }
  else if (e.key === 'Escape' && isOpen.value) {
    e.preventDefault()
    closeDropdown()
  }
}

const handleScrollOrResize = () => {
  if (isOpen.value) updatePosition()
}

onMounted(() => {
  window.addEventListener('resize', handleScrollOrResize, { passive: true })
  window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleScrollOrResize)
  window.removeEventListener('scroll', handleScrollOrResize, { capture: true })
})

const selectedOption = computed(() => options.find(opt => opt.value === model.value))
const displayLabel = computed(() => selectedOption.value?.label || placeholder || '')
const isPlaceholder = computed(() => !selectedOption.value && Boolean(placeholder))

defineExpose({
  isOpen,
  selectOption,
  openDropdown,
  closeDropdown,
})
</script>

<template>
  <div class="relative custom-select" :class="[`select--${size}`, { 'is-error': error, 'w-full': block, 'inline-block': !block }]" :data-disabled="disabled">
    <button :id="selectId" ref="triggerRef" type="button" :name="name" :title="title" class="relative z-[1] focus:z-[2] flex w-full items-center justify-between custom-select__value" :class="{ 'is-placeholder': isPlaceholder, 'is-open': isOpen, 'is-error': error }" :disabled="disabled" @click="toggleDropdown" @keydown="handleKeydown" @blur="emit('blur', $event)" @focus="emit('focus', $event)">
      <span v-if="icon || prefix || $slots.prefix" class="select-affix select-prefix inline-flex items-center shrink-0">
        <Icon v-if="icon" :name="icon" class="affix-icon" />
        <slot name="prefix">{{ prefix }}</slot>
      </span>

      <span class="flex-1 text-left custom-select__label">{{ displayLabel }}</span>

      <Icon name="chevron-down" class="custom-select__arrow" :class="{ 'is-open': isOpen }" />
    </button>

    <ul ref="dropdownRef" popover="auto" class="z-select max-w-[min(90vw,400px)] max-h-[min(250px,40vh)] overflow-x-hidden overflow-y-auto custom-select__dropdown" :class="[`is-${dropdownPlacement}`, `select-dropdown--${size}`]" :style="{ position: 'fixed', top: dropdownPos.top || undefined, bottom: dropdownPos.bottom || undefined, left: dropdownPos.left, minWidth: dropdownPos.minWidth }" @toggle="onPopoverToggle">
      <li v-for="option in options" :key="String(option.value)" class="flex items-center justify-between custom-select__option" :class="{ 'is-active': model === option.value, 'is-disabled': option.disabled }" @click="selectOption(option)">
        <span class="custom-select__option-text">{{ option.label }}</span>
        <Icon v-if="model === option.value" name="check" class="option-check" />
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.custom-select {
  --select-height: 2.5rem; // md: 40px
  --select-font-size: var(--font-size-sm);
  --select-padding-x: var(--space-3);
  --select-gap: var(--space-2);
  --glow-color: var(--theme-accent, var(--color-category-main));

  @include control-glow-tokens;

  min-width: 0;
  font-size: var(--select-font-size);
  color: var(--color-text-main);

  // --- サイズ展開 (Geist準拠: sm 32px / md 40px / lg 48px) ---
  &.select--sm {
    --select-height: 2rem; // 32px
    --select-font-size: var(--font-size-xs);
    --select-padding-x: var(--space-2);
    --select-gap: var(--space-1);
  }

  &.select--md {
    --select-height: 2.5rem; // 40px
    --select-font-size: var(--font-size-sm);
    --select-padding-x: var(--space-3);
    --select-gap: var(--space-2);
  }

  &.select--lg {
    --select-height: 3rem; // 48px
    --select-font-size: var(--font-size-base);
    --select-padding-x: var(--space-4);
    --select-gap: var(--space-3);
  }

  &[data-disabled="true"] {
    @include state-disabled;
  }
}

.custom-select__value {
  gap: var(--select-gap);

  height: var(--select-height);
  padding-block: 0;
  padding-inline: var(--select-padding-x);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: 0; // 直角規約

  font-size: inherit;
  color: inherit;

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-interactive);

  @include state-interactive;

  &.is-error {
    --glow-color: var(--color-status-danger);

    border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
  }

  &:hover:not(:disabled) {
    border-color: var(--glow-color);
    box-shadow: var(--shadow-glow-hover);
  }

  &:active:not(:disabled) {
    border-color: var(--glow-color);
    box-shadow: var(--shadow-glow-active);
  }

  &.is-open,
  &:focus,
  &:focus-visible {
    border-color: color-mix(in srgb, var(--glow-color) 70%, transparent);
    outline: none;
    box-shadow: var(--shadow-glow-focus);
  }

  &.is-placeholder {
    color: color-mix(in srgb, var(--color-text-muted) 50%, transparent);
  }

  @include state-disabled;
}

.custom-select__dropdown {
  --dropdown-border-color: color-mix(
    in srgb,
    var(--glow-color, var(--theme-accent)) 60%,
    transparent
  );

  inset: unset;

  margin: 0;
  padding: var(--space-1);
  border: var(--border-width-base) solid var(--dropdown-border-color);
  border-radius: 0; // 直角規約

  font-size: var(--select-font-size, var(--font-size-sm));
  color: var(--color-text-main);

  background-color: var(--surface-bg-solid);
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-elevation-md);

  transition: var(--transition-base);

  &.select-dropdown--sm {
    font-size: var(--font-size-xs);
  }

  &.select-dropdown--lg {
    font-size: var(--font-size-base);
  }
}

.custom-select__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-affix {
  user-select: none;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.affix-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-text-muted);
}

.custom-select__arrow {
  width: 1rem;
  height: 1rem;
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);

  &.is-open {
    transform: rotate(180deg);
  }
}

.custom-select__option {
  overflow: hidden;
  gap: var(--space-2);

  padding-block: var(--space-2);
  padding-inline: var(--space-3);
  border-radius: 0; // 直角規約

  font-size: inherit;
  color: var(--color-text-main);
  text-overflow: ellipsis;
  white-space: nowrap;

  transition: var(--transition-colors);

  @include state-interactive;

  &:is(:hover, .is-active) {
    color: var(--glow-color, var(--theme-accent));
    background-color: color-mix(
      in srgb,
      var(--glow-color, var(--theme-accent)) 15%,
      transparent
    );
  }

  @include state-disabled;
}

.option-check {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--glow-color, var(--theme-accent));
}

.custom-select__option-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
