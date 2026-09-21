<script setup lang="ts" generic="T extends string | number | boolean = string | number | boolean">
/**
 * Select
 * [Atoms] キーボード操作や画面外へのはみ出し防止機能に対応した、カスタムのセレクトボックスコンポーネント。
 */
import { type ComponentPublicInstance, computed, inject, nextTick, ref, toRef, watch } from 'vue'

import { useClickOutside } from '~/composables/useClickOutside'
import { useFloatingPlacement } from '~/composables/useFloatingPlacement'
import { useListKeyboardNav } from '~/composables/useListKeyboardNav'
import type { SelectOption, SelectProps } from '~/types/components'
import { FORM_GROUP_KEY } from '~/types/components'

const model = defineModel<T | null>()

const props = withDefaults(
  defineProps<SelectProps<T>>(),
  {
    disabled: false,
    error: false,
    clearable: true,
  },
)

const emit = defineEmits<{
  (e: 'change', value: T | null): void
  (e: 'clear'): void
}>()

defineSlots<{
  selected?: (props: { option?: SelectOption<T>, label: string }) => unknown
  option?: (props: { option: SelectOption<T>, isSelected: boolean }) => unknown
}>()

const formGroup = inject(FORM_GROUP_KEY, null)
const selectId = computed(() => props.id || formGroup?.id.value)
const isError = computed(() => props.error || (formGroup?.hasError.value ?? false))

const triggerRef = ref<HTMLButtonElement | null>(null)
const selectRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const optionRefs = ref<HTMLElement[]>([])
const isOpen = ref(false)

useClickOutside(selectRef, () => {
  isOpen.value = false
}, {
  ignore: [dropdownRef],
})

const {
  dynamicPlacement,
  dropdownStyle,
  teleportTarget,
  calculatePlacement,
} = useFloatingPlacement(selectRef, dropdownRef, isOpen, {
  preferredPlacement: props.placement,
})

const syncedDropdownStyle = computed(() => {
  let triggerFs: string | undefined
  let themeAccent: string | undefined
  let glowColor: string | undefined

  if (import.meta.client && selectRef.value) {
    const cs = getComputedStyle(selectRef.value)

    triggerFs = cs.fontSize
    const rawAccent = cs.getPropertyValue('--theme-accent').trim()
    const rawGlow = cs.getPropertyValue('--glow-color').trim()

    if (rawAccent) themeAccent = rawAccent
    if (rawGlow) glowColor = rawGlow
  }

  return {
    ...dropdownStyle.value,
    fontSize: triggerFs,
    ...(themeAccent ? { '--theme-accent': themeAccent } : {}),
    ...(glowColor ? { '--glow-color': glowColor } : {}),
  }
})

const selectOption = (option: SelectOption<T>) => {
  if (option.disabled) return
  model.value = option.value
  emit('change', option.value)
  isOpen.value = false
  triggerRef.value?.focus()
}

const handleClear = () => {
  model.value = null
  emit('change', null)
  emit('clear')
  isOpen.value = false
  triggerRef.value?.focus()
}

const {
  focusedIndex,
  resetFocus,
  handleKeydown,
} = useListKeyboardNav<SelectOption<T>>({
  options: computed(() => props.options),
  isOpen,
  onSelect: selectOption,
  onClear: handleClear,
  disabled: toRef(props, 'disabled'),
})

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === model.value)
})

const displayLabel = computed(() => {
  if (selectedOption.value) return selectedOption.value.label

  return props.placeholder || ''
})

const isPlaceholder = computed(() => {
  return !selectedOption.value && !!props.placeholder
})

const canClear = computed(() => {
  return (
    props.clearable
    && !props.disabled
    && model.value !== null
    && model.value !== undefined
    && model.value !== ''
  )
})

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

// ドロップダウン内のキーボードスクロール追従
watch(focusedIndex, async (newIndex) => {
  if (newIndex >= 0 && isOpen.value) {
    await nextTick()
    const targetEl = optionRefs.value[newIndex]

    targetEl?.scrollIntoView({ block: 'nearest' })
  }
})

watch(isOpen, (newVal) => {
  if (newVal) {
    calculatePlacement()
    const index = props.options.findIndex(opt => opt.value === model.value)

    resetFocus(index)
  }
  else {
    resetFocus(-1)
    optionRefs.value = []
  }
})

const setOptionRef = (el: Element | ComponentPublicInstance | null, index: number) => {
  if (el) {
    optionRefs.value[index] = (el instanceof HTMLElement ? el : (el as ComponentPublicInstance).$el) as HTMLElement
  }
}

const getOptionClasses = (option: SelectOption<T>, index: number) => [
  'relative z-[1] overflow-hidden py-[0.4em] px-[0.8em] custom-select__option',
  {
    'is-selected': model.value === option.value,
    'is-focused': index === focusedIndex.value,
    'is-disabled': option.disabled,
  },
]

defineExpose({
  /** トリガーボタンへのフォーカス */
  focus: (options?: FocusOptions) => triggerRef.value?.focus(options),
  /** フォーカス解除 */
  blur: () => triggerRef.value?.blur(),
  /** ドロップダウンを開く */
  open: () => {
    if (!props.disabled) isOpen.value = true
  },
  /** ドロップダウンを閉じる */
  close: () => {
    isOpen.value = false
  },
  /** 開閉トグル */
  toggle: toggleDropdown,
  /** DOM 参照 */
  selectRef,
  triggerRef,
})
</script>

<template>
  <div
    ref="selectRef"
    class="relative w-full min-w-0 custom-select"
    :class="{ 'is-error': isError }"
    :data-disabled="disabled"
  >
    <button
      :id="selectId"
      ref="triggerRef"
      type="button"
      class="relative z-[1] focus:z-[2] flex w-full items-center justify-between gap-2 py-[0.3em] custom-select__value"
      :class="{
        'is-placeholder': isPlaceholder,
        'is-active': isOpen,
        'is-error': isError,
      }"
      :disabled="disabled"
      @click="toggleDropdown"
      @keydown="handleKeydown"
    >
      <slot name="selected" :option="selectedOption" :label="displayLabel">
        <span class="flex-1 text-left custom-select__label">{{ displayLabel }}</span>
      </slot>

      <div class="flex items-center gap-1 shrink-0">

        <FormControlAction
          v-if="canClear"
          icon="x"
          title="選択解除"
          @click="handleClear"
        />

        <FormControlAction
          icon="chevron-down"
          :rotate="isOpen"
          :interactive="false"
        />
      </div>
    </button>

    <Teleport :to="teleportTarget">
      <transition name="dropdown-fade">
        <ul
          v-if="isOpen"
          ref="dropdownRef"
          class="absolute z-select w-max max-w-[90vw] max-h-[min(250px,40vh)] overflow-x-hidden overflow-y-auto p-1 custom-select__dropdown"
          :class="`is-${dynamicPlacement}`"
          :style="syncedDropdownStyle"
        >
          <li
            v-for="(option, index) in options"
            :key="String(option.value)"
            :ref="(el) => setOptionRef(el, index)"
            :class="getOptionClasses(option, index)"
            @click="selectOption(option)"
          >
            <slot name="option" :option="option" :is-selected="model === option.value">
              {{ option.label }}
            </slot>
          </li>
        </ul>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.custom-select {
  user-select: none;

  width: var(--select-width, 100%);
  min-width: var(--select-min-width, 0);

  font-size: inherit;
  color: var(--color-text-main);

  &[data-disabled="true"] {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.custom-select__value {
  --glow-color: var(--theme-accent);

  cursor: pointer;
  user-select: none;

  min-height: calc(var(--control-height-ratio) * 1em);
  padding-inline: var(--select-padding-inline, 1.2em);
  border: var(--border-width-base) solid var(--color-border);
  border-left: var(--select-border-left, var(--border-width-base) solid var(--color-border));

  font-size: inherit;
  color: inherit;

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-interactive);

  &:not(:disabled, .is-disabled) {
    &:hover {
      border-color: var(--glow-color);
      box-shadow: var(--shadow-glow-hover);
    }

    &:active {
      border-color: var(--glow-color);
      box-shadow: var(--shadow-glow-active);
    }

    &.is-active,
    &:focus,
    &:focus-visible {
      margin-left: var(--select-margin-left-active, 0);
      border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
      border-left: var(
        --select-border-left-active,
        var(--border-width-base) solid color-mix(in srgb, var(--glow-color) 60%, transparent)
      );

      outline: none;
      box-shadow: var(--shadow-glow-focus);
    }

    &.is-error {
      --glow-color: var(--color-status-danger);

      border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);

      &.is-active,
      &:focus,
      &:focus-visible {
        border-color: var(--glow-color);
        border-left: var(--select-border-left-active, var(--border-width-base) solid var(--glow-color));
      }
    }
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
  --scrollbar-size: var(--space-2);

  transform: translateZ(0);

  border: var(--border-width-base) solid var(--dropdown-border-color);

  background-color: var(--surface-bg-solid);
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-elevation-md);

  transition: var(--transition-base);

  .custom-select.is-error & {
    --dropdown-border-color: color-mix(
      in srgb,
      var(--color-status-danger) 60%,
      transparent
    );
  }
}

.custom-select__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-select__option {
  cursor: pointer;
  user-select: none;

  font-size: inherit;
  color: var(--color-text-main);
  text-overflow: ellipsis;
  white-space: nowrap;

  transition: var(--transition-colors);

  &:not(:is(.is-disabled, .is-placeholder)) {
    &:is(:hover, .is-focused, .is-selected) {
      color: var(--theme-accent);
      background-color: color-mix(in srgb, var(--theme-accent) 15%, transparent);
    }
  }

  @include state-disabled;
}
</style>

<style lang="scss">
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: var(--transition-base);
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  transform: translateY(-5px);
  opacity: 0;

  &.is-top {
    transform: translateY(5px);
  }
}
</style>
