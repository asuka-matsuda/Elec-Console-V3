<script setup lang="ts">
/**
 * AppSelect
 * キーボード操作や画面外へのはみ出し防止機能に対応した、カスタムのセレクトボックスコンポーネント。
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

const containerClasses = computed(() => [
  'c-custom-select',
  {
    'is-error': props.error,
  },
])

const buttonClasses = computed(() => [
  'c-custom-select__value',
  {
    'is-placeholder': isPlaceholder.value,
    'is-active': isOpen.value,
  },
])

const dropdownClasses = computed(() => [
  'c-custom-select__dropdown',
  `is-${dynamicPlacement.value}`,
])

const getOptionClasses = (option: SelectOption, index: number) => [
  'c-custom-select__option',
  {
    'is-selected': model.value === option.value,
    'is-focused': index === focusedIndex.value,
    'is-disabled': option.disabled,
  },
]
</script>

<template>
  <div ref="selectRef" :class="containerClasses" :data-disabled="disabled">
    <button
      type="button"
      :class="buttonClasses"
      :disabled="disabled"
      @click="toggleDropdown"
      @keydown="handleKeydown"
    >
      <span class="c-custom-select__text">{{ displayLabel }}</span>
    </button>

    <ClientOnly>
      <Teleport :to="teleportTarget">
        <transition name="dropdown-fade">
          <div
            v-if="isOpen"
            ref="dropdownRef"
            :class="dropdownClasses"
            :style="dropdownStyle"
          >
            <ul class="c-custom-select__list">
              <li
                v-if="isPlaceholder"
                class="c-custom-select__option is-placeholder"
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
.c-custom-select {
  user-select: none;
  position: relative;
  width: 100%;
  color: var(--color-text-main);

  &[data-disabled="true"] {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.c-custom-select__value {
  cursor: pointer;
  user-select: none;

  position: relative;
  z-index: 1;

  display: flex;
  align-items: center;

  width: 100%;
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

    .c-custom-select.is-error & {
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
    margin-left: var(--space-2);

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

.c-custom-select__text {
  overflow: hidden;
  flex: 1;

  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.c-custom-select__dropdown {
  --glow-color: color-mix(in srgb, var(--theme-accent) 20%, transparent);

  position: absolute;
  position: relative;
  z-index: var(--z-index-select);
  z-index: 1;

  width: max-content;
  max-width: 90vw;
  border: var(--border-width-base) solid var(--theme-accent);
  border-radius: var(--radius-sm);

  background-color: var(--surface-bg-solid);
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-elevation-md);

  transition: var(--transition-base);

  .c-custom-select.is-error & {
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

.c-custom-select__list {
  --scrollbar-size: var(--space-2);

  transform: translateZ(0);

  overflow: hidden auto;

  width: 100%;
  max-height: min(250px, 40vh);
  padding: var(--space-1);
}

.c-custom-select__option {
  cursor: pointer;
  user-select: none;

  position: relative;
  z-index: 1;

  overflow: hidden;

  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;

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
      --glow-color: var(--theme-accent);

      color: var(--theme-accent);
      background-color: color-mix(in srgb, var(--theme-accent) 15%, transparent);
      box-shadow: var(--shadow-glow-hover);
      transition: var(--transition-glow);
    }

    &.is-selected {
      --glow-color: var(--theme-accent);

      color: var(--theme-accent);
      background-color: color-mix(in srgb, var(--theme-accent) 15%, transparent);
      box-shadow: var(--shadow-glow-hover);
      transition: var(--transition-glow);
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
