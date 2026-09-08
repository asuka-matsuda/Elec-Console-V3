<script setup lang="ts">
/**
 * AtomsSelect
 * [Atoms] キーボード操作や画面外へのはみ出し防止機能に対応した、カスタムのセレクトボックスコンポーネント。
 */
import { computed, onMounted, ref, toRef, watch } from 'vue'

import { useClickOutside } from '~/composables/useClickOutside'
import { useFloatingPlacement } from '~/composables/useFloatingPlacement'
import { useListKeyboardNav } from '~/composables/useListKeyboardNav'
import type { SelectOption } from '~/types/components'

const model = defineModel<string | number | boolean | null>()

const props = withDefaults(
  defineProps<{
    options: SelectOption[]
    placeholder?: string
    disabled?: boolean
    error?: boolean
    placement?: 'top' | 'bottom'
    size?: 'sm' | 'md'
  }>(),
  {
    disabled: false,
    error: false,
    size: 'md',
  },
)

const selectRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const isMounted = ref(false)

useClickOutside(selectRef, () => {
  isOpen.value = false
})

const {
  dynamicPlacement,
  dropdownStyle,
  teleportTarget,
  calculatePlacement,
} = useFloatingPlacement(selectRef, dropdownRef, isOpen, {
  preferredPlacement: props.placement,
})

const selectOption = (option: SelectOption) => {
  if (option.disabled) return
  model.value = option.value
  isOpen.value = false
}

const {
  focusedIndex,
  resetFocus,
  handleKeydown,
} = useListKeyboardNav<SelectOption>({
  options: computed(() => props.options),
  isOpen,
  onSelect: selectOption,
  onClear: () => {
    model.value = undefined
  },
  disabled: toRef(props, 'disabled'),
})

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === model.value)
})

const displayLabel = computed(() => {
  if (!isMounted.value) return props.placeholder || ''
  if (selectedOption.value) return selectedOption.value.label

  return props.placeholder || ''
})

const isPlaceholder = computed(() => {
  if (!isMounted.value) return !!props.placeholder

  return !selectedOption.value && !!props.placeholder
})

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

watch(isOpen, (newVal) => {
  if (newVal) {
    calculatePlacement()
    const index = props.options.findIndex(opt => opt.value === model.value)

    resetFocus(index)
  }
  else {
    resetFocus(-1)
  }
})

onMounted(() => {
  isMounted.value = true
})

const getOptionClasses = (option: SelectOption, index: number) => [
  'relative overflow-hidden py-2 px-3 truncate custom-select__option',
  {
    'is-selected': model.value === option.value,
    'is-focused': index === focusedIndex.value,
    'is-disabled': option.disabled,
  },
]
</script>

<template>
  <div
    ref="selectRef"
    class="relative w-full custom-select"
    :class="[
      size === 'sm' ? 'is-sm' : '',
      { 'is-error': error },
    ]"
    :data-disabled="disabled"
  >
    <button
      type="button"
      class="relative flex w-full items-center justify-between gap-2 custom-select__value"
      :class="{
        'is-placeholder': isPlaceholder,
        'is-active': isOpen,
      }"
      :disabled="disabled"
      @click="toggleDropdown"
      @keydown="handleKeydown"
    >
      <slot name="selected" :option="selectedOption" :label="displayLabel">
        <span class="flex-1 text-left truncate">{{ displayLabel }}</span>
      </slot>
    </button>

    <Teleport :to="teleportTarget">
      <transition name="dropdown-fade">
        <ul
          v-if="isOpen"
          ref="dropdownRef"
          class="absolute w-max max-w-[90vw] overflow-x-hidden overflow-y-auto p-1 custom-select__dropdown"
          :class="[`is-${dynamicPlacement}`, size === 'sm' ? 'is-sm' : '']"
          :style="dropdownStyle"
        >
          <li
            v-if="isPlaceholder"
            class="relative overflow-hidden py-2 px-3 truncate custom-select__option is-placeholder"
          >
            {{ placeholder }}
          </li>
          <li
            v-for="(option, index) in options"
            :key="String(option.value)"
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
  font-size: var(--font-size-sm);
  color: var(--color-text-main);

  &.is-sm {
    font-size: var(--font-size-2xs);
  }

  &[data-disabled="true"] {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.custom-select__value {
  --glow-color: var(--theme-accent);

  cursor: pointer;
  user-select: none;

  z-index: 1;

  min-height: calc(var(--control-height-ratio) * 1em);
  padding-block: 0.3em;
  padding-inline: 1.2em;
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  font-size: inherit;
  color: inherit;

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-glow);

  &:is(:disabled, .is-disabled) {
    cursor: not-allowed;
    opacity: 0.5;
  }

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
      border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
      outline: none;
      box-shadow: var(--shadow-glow-focus);
    }

    .custom-select.is-error & {
      --glow-color: var(--color-status-danger);

      border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
      color: var(--glow-color);

      &.is-active,
      &:focus,
      &:focus-visible {
        border-color: var(--glow-color);
      }
    }
  }

  &::after {
    content: "";

    position: relative;
    z-index: 1;

    flex-shrink: 0;

    width: 1.2em;
    height: 1.2em;

    background-image: var(--icon-select-arrow);
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;

    transition: var(--transition-base);
  }

  &.is-placeholder {
    color: color-mix(in srgb, var(--color-text-muted) 50%, transparent);
  }

  &.is-active::after {
    transform: rotate(180deg);
  }
}

.custom-select__dropdown {
  --dropdown-border-color: var(--theme-accent);
  --scrollbar-size: var(--space-2);

  z-index: var(--z-index-select);
  transform: translateZ(0);

  max-height: min(250px, 40vh);
  border: var(--border-width-base) solid var(--dropdown-border-color);
  border-radius: var(--radius-sm);

  background-color: var(--surface-bg-solid);
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-elevation-md);

  transition: var(--transition-base);

  .custom-select.is-error & {
    --dropdown-border-color: color-mix(
      in srgb,
      var(--color-status-danger) 50%,
      transparent
    );
  }
}

.custom-select__option {
  cursor: pointer;
  user-select: none;

  z-index: 1;

  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  color: var(--color-text-main);

  transition: var(--transition-base);

  &.is-disabled {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.5;
  }

  &.is-placeholder {
    cursor: default;
    font-style: italic;
    color: var(--color-text-muted);
  }

  &:not(:is(.is-disabled, .is-placeholder)) {
    &:is(:hover, .is-focused, .is-selected) {
      color: var(--theme-accent);
      background-color: var(--color-selection-bg);
      transition: background-color var(--duration-fast) var(--ease-base);
    }

    &.is-selected {
      font-weight: var(--font-weight-semibold);
    }
  }

  .custom-select__dropdown.is-sm & {
    padding-block: var(--space-1);
    padding-inline: var(--space-2);
    font-size: var(--font-size-2xs);
  }
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
