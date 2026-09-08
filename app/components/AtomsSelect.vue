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

const props = defineProps<{
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  error?: boolean
  placement?: 'top' | 'bottom'
}>()

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
  'relative z-1 overflow-hidden py-2 px-3 truncate custom-select__option',
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
    :class="{ 'is-error': error }"
    :data-disabled="disabled"
  >
    <button
      type="button"
      class="relative z-1 flex w-full items-center justify-between gap-2 custom-select__value"
      :class="{
        'is-placeholder': isPlaceholder,
        'is-active': isOpen,
      }"
      :disabled="disabled"
      @click="toggleDropdown"
      @keydown="handleKeydown"
    >
      <span class="flex-1 text-left truncate">{{ displayLabel }}</span>
    </button>

    <ClientOnly>
      <Teleport :to="teleportTarget">
        <transition name="dropdown-fade">
          <div
            v-if="isOpen"
            ref="dropdownRef"
            class="absolute w-max max-w-[90vw] custom-select__dropdown"
            :class="`is-${dynamicPlacement}`"
            :style="dropdownStyle"
          >
            <ul class="w-full overflow-x-hidden overflow-y-auto p-1 custom-select__list">
              <li
                v-if="isPlaceholder"
                class="relative z-1 overflow-hidden py-2 px-3 truncate custom-select__option is-placeholder"
              >
                {{ placeholder }}
              </li>
              <li
                v-for="(option, index) in options"
                :key="String(option.value)"
                :class="getOptionClasses(option, index)"
                @click="selectOption(option)"
              >
                {{ option.label }}
              </li>
            </ul>
          </div>
        </transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped lang="scss">
.custom-select {
  user-select: none;
  color: var(--color-text-main);

  &[data-disabled="true"] {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.custom-select__value {
  cursor: pointer;
  user-select: none;

  min-height: calc(var(--control-height-ratio) * 1em);
  padding-block: 0.3em;
  padding-inline: 1.2em;
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  color: inherit;

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-glow);

  &:is(:disabled, .is-disabled) {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:not(:disabled, .is-disabled) {
    --glow-color: var(--theme-accent);

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
        border-color: var(--glow-color);
        outline: none;
        box-shadow: var(--shadow-glow-focus);
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

  &.is-active {
    &::after {
      transform: rotate(180deg);
    }
  }
}

.custom-select__dropdown {
  --glow-color: color-mix(in srgb, var(--theme-accent) 20%, transparent);

  z-index: var(--z-index-select);

  border: var(--border-width-base) solid var(--theme-accent);
  border-radius: var(--radius-sm);

  background-color: var(--surface-bg-solid);
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-elevation-md);

  transition: var(--transition-base);

  .custom-select.is-error & {
    --glow-color: color-mix(
      in srgb,
      var(--color-status-danger) 20%,
      transparent
    );

    border-color: color-mix(
      in srgb,
      var(--color-status-danger) 50%,
      transparent
    );
    box-shadow: var(--shadow-elevation-md);
    transition: var(--transition-base);
  }
}

.custom-select__list {
  --scrollbar-size: var(--space-2);

  transform: translateZ(0);
  max-height: min(250px, 40vh);
}

.custom-select__option {
  cursor: pointer;
  user-select: none;

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
    &:is(:hover, .is-focused) {
      color: var(--theme-accent);
      background-color: var(--color-selection-bg);
      transition: background-color var(--duration-fast) var(--ease-base);
    }

    &.is-selected {
      font-weight: var(--font-weight-semibold);
      color: var(--theme-accent);
      background-color: var(--color-selection-bg);
      transition: background-color var(--duration-fast) var(--ease-base);
    }
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
