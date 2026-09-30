<script setup lang="ts" generic="T extends string | number | boolean = string | number | boolean">
/**
 * Select
 * ドロップダウンセレクトボックスコンポーネント。
 */
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'

import { FORM_GROUP_KEY } from '~/constants/injectionKeys'
import type { SelectOption, SelectProps } from '~/types/components'

const model = defineModel<T | null>()

const props = withDefaults(defineProps<SelectProps<T>>(), {
  options: () => [],
  placeholder: '',
  disabled: false,
  error: false,
})

const formGroup = inject(FORM_GROUP_KEY, null)
const selectId = computed(() => props.id || formGroup?.id.value)
const isError = computed(() => props.error || (formGroup?.hasError.value ?? false))

const triggerRef = ref<HTMLButtonElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

// フローティング配置座標（上下自動反転 Flip）
const dropdownPlacement = ref<'bottom' | 'top'>('bottom')
const dropdownPos = ref({ top: '', bottom: '', left: '', minWidth: '' })

const updatePosition = () => {
  if (!triggerRef.value || typeof window === 'undefined') return

  const rect = triggerRef.value.getBoundingClientRect()
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
  if (props.disabled) return

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
  closeDropdown()
  triggerRef.value?.focus()
}

const handleResize = () => {
  if (isOpen.value) updatePosition()
}

onMounted(() => {
  window.addEventListener('resize', handleResize, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const selectedOption = computed(() => props.options.find(opt => opt.value === model.value))
const displayLabel = computed(() => selectedOption.value?.label || props.placeholder || '')
const isPlaceholder = computed(() => !selectedOption.value && Boolean(props.placeholder))

defineExpose({
  isOpen,
  selectOption,
  openDropdown,
  closeDropdown,
})
</script>

<template>
  <div
    class="relative w-full min-w-0 custom-select"
    :class="{ 'is-error': isError }"
    :data-disabled="disabled"
  >
    <button
      :id="selectId"
      ref="triggerRef"
      type="button"
      class="relative z-[1] focus:z-[2] flex w-full items-center justify-between gap-item-gap custom-select__value"
      :class="{
        'is-placeholder': isPlaceholder,
        'is-open': isOpen,
        'is-error': isError,
      }"
      :disabled="disabled"
      @click="toggleDropdown"
    >
      <span class="flex-1 text-left custom-select__label">{{ displayLabel }}</span>

      <Icon
        name="chevron-down"
        class="custom-select__arrow"
        :class="{ 'is-open': isOpen }"
      />
    </button>

    <ul
      ref="dropdownRef"
      popover="auto"
      class="z-select max-w-[min(90vw,400px)] max-h-[min(250px,40vh)] overflow-x-hidden overflow-y-auto p-inline-gap custom-select__dropdown"
      :class="`is-${dropdownPlacement}`"
      :style="{
        position: 'fixed',
        top: dropdownPos.top || undefined,
        bottom: dropdownPos.bottom || undefined,
        left: dropdownPos.left,
        minWidth: dropdownPos.minWidth,
      }"
      @toggle="onPopoverToggle"
    >
      <li
        v-for="option in options"
        :key="String(option.value)"
        class="custom-select__option"
        :class="{
          'is-active': model === option.value,
          'is-disabled': option.disabled,
        }"
        @click="selectOption(option)"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.custom-select {
  font-size: inherit;
  color: var(--color-text-main);

  &[data-disabled="true"] {
    @include state-disabled;
  }
}

.custom-select__value {
  --glow-color: var(--theme-accent);

  min-height: calc(var(--control-height-ratio) * 1em);
  padding-block: 0.3em;
  padding-inline: 0.8em;
  border: var(--border-width-base) solid var(--color-border);

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

  &:hover {
    border-color: var(--glow-color);
    box-shadow: var(--shadow-glow-hover);
  }

  &:active {
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
  border: var(--border-width-base) solid var(--dropdown-border-color);

  font-size: var(--font-size-base);
  color: var(--color-text-main);

  background-color: var(--surface-bg-solid);
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-elevation-md);

  transition: var(--transition-base);
}

.custom-select__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-select__arrow {
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);

  &.is-open {
    transform: rotate(180deg);
  }
}

.custom-select__option {
  overflow: hidden;

  padding: 0.4em 0.8em;

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
</style>
