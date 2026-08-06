<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export interface SelectOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

const model = defineModel<string | number | boolean>()

const props = defineProps<{
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  error?: boolean
}>()

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)
const focusedIndex = ref(-1)

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === model.value)
})

const displayLabel = computed(() => {
  if (selectedOption.value) return selectedOption.value.label
  return props.placeholder || ''
})

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

const selectOption = (option: SelectOption) => {
  if (option.disabled) return
  model.value = option.value
  isOpen.value = false
}

// --- Keyboard Navigation ---
const focusNext = () => {
  let nextIndex = focusedIndex.value + 1
  while (nextIndex < props.options.length) {
    if (!props.options[nextIndex].disabled) {
      focusedIndex.value = nextIndex
      return
    }
    nextIndex++
  }
}

const focusPrev = () => {
  let prevIndex = focusedIndex.value - 1
  while (prevIndex >= 0) {
    if (!props.options[prevIndex].disabled) {
      focusedIndex.value = prevIndex
      return
    }
    prevIndex--
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return

  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (isOpen.value) {
        if (focusedIndex.value >= 0 && focusedIndex.value < props.options.length) {
          selectOption(props.options[focusedIndex.value])
        } else {
          isOpen.value = false
        }
      } else {
        isOpen.value = true
      }
      break
    case 'Escape':
      if (isOpen.value) {
        isOpen.value = false
        event.stopPropagation()
      }
      break
    case 'ArrowDown':
      event.preventDefault()
      if (!isOpen.value) {
        isOpen.value = true
      } else {
        focusNext()
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) {
        isOpen.value = true
      } else {
        focusPrev()
      }
      break
  }
}

// Reset focus state when dropdown opens
watch(isOpen, (newVal) => {
  if (newVal) {
    const index = props.options.findIndex(opt => opt.value === model.value)
    if (index >= 0) {
      focusedIndex.value = index
    } else {
      focusedIndex.value = -1
      focusNext()
    }
  } else {
    focusedIndex.value = -1
  }
})

// --- Click Outside ---
const handleClickOutside = (event: MouseEvent) => {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="c-custom-select" ref="selectRef" :class="{ 'is-disabled': disabled, 'is-error': error }">
    <!-- Trigger Element (Changed to button for native focus handling) -->
    <button
      type="button"
      class="c-custom-select__value"
      :class="{
        'is-placeholder': !selectedOption && placeholder,
        'is-active': isOpen
      }"
      :disabled="disabled"
      @click="toggleDropdown"
      @keydown="handleKeydown"
    >
      {{ displayLabel }}
    </button>

    <!-- Dropdown Menu -->
    <transition name="dropdown-fade">
      <div v-if="isOpen" class="c-custom-select__dropdown">
        <ul class="c-custom-select__list">
          <li
            v-if="placeholder && !selectedOption"
            class="c-custom-select__option is-placeholder"
          >
            {{ placeholder }}
          </li>
          <li
            v-for="(option, index) in options"
            :key="String(option.value)"
            class="c-custom-select__option"
            :class="{
              'is-selected': model === option.value,
              'is-focused': index === focusedIndex,
              'is-disabled': option.disabled
            }"
            @click="selectOption(option)"
          >
            {{ option.label }}
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.c-custom-select {
  position: relative;
  width: 100%;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-main);
  user-select: none;

  &.is-disabled {
    pointer-events: none;
    opacity: 0.5;

    .c-custom-select__value {
      background-color: glass-color(5%);
    }
  }
}

.c-custom-select__value {
  @extend %click-enabled;

  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: var(--size-control-md);
  padding: 0 var(--space-10) 0 var(--space-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: var(--border-width-base) solid glass-color(25%);
  box-shadow: var(--edge-reflex-base), var(--shadow-sink);
  transition: var(--transition-base);
  background-color: transparent;
  appearance: none; // Reset button styles
  text-align: left;

  // Arrow icon (down)
  &::after {
    position: absolute;
    top: 50%;
    right: var(--space-4);
    width: var(--size-4);
    height: var(--size-3);
    content: '';
    background-image: var(--icon-select-arrow);
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    transform: translateY(-50%);
    transition: var(--transition-base);
  }

  // --- States ---
  &:hover:not(:disabled):not(.is-active) {
    @include ui-hover-glow;
  }

  &:focus,
  &:focus-visible {
    outline: none;
    @include ui-focus(var(--color-category-main));
    @include cyber-text-glow(50%, 8px, var(--color-category-main));
  }

  &:active:not(:disabled) {
    @include ui-press(var(--color-category-main));
  }

  &.is-placeholder {
    color: var(--color-text-muted);
  }

  &.is-active {
    @include ui-press(var(--color-category-main));
    @include cyber-text-glow(50%, 8px, var(--color-category-main));

    &::after {
      transform: translateY(-50%) rotate(180deg);
    }
  }

  // Error State inherited from wrapper
  .c-custom-select.is-error & {
    color: var(--color-status-danger);
    border-color: var(--color-status-danger);
    box-shadow:
      inset 0 0 var(--blur-sm) theme-color(var(--color-status-danger), 30%),
      0 0 6px theme-color(var(--color-status-danger), 50%);

    &.is-active,
    &:focus {
      @include cyber-text-glow(50%, 8px, var(--color-status-danger));
    }
  }
}

.c-custom-select__dropdown {
  position: absolute;
  top: calc(100% + var(--space-1));
  left: 0;
  z-index: 100;
  width: max-content;
  min-width: 100%;
  max-width: 90vw;
  background-color: var(--color-main-bg);
  border: var(--border-width-base) solid theme-color(var(--color-category-main), 50%);
  box-shadow:
    var(--shadow-elevation-hover),
    inset 0 0 10px theme-color(var(--color-category-main), 20%);

  // Error state dropdown border
  .c-custom-select.is-error & {
    border-color: theme-color(var(--color-status-danger), 50%);
    box-shadow:
      var(--shadow-elevation-hover),
      inset 0 0 10px theme-color(var(--color-status-danger), 20%);
  }
}

.c-custom-select__list {
  box-sizing: border-box;
  width: 100%;
  max-height: 250px;
  overflow: hidden auto;
  scrollbar-color: var(--color-category-main) transparent;
  scrollbar-width: thin;
  transform: translateZ(0);
  margin: 0;
  padding: 0;
  list-style: none;
}

.c-custom-select__option {
  @extend %click-enabled;

  padding: var(--space-2) var(--space-3);
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--text-sm);
  color: var(--color-text-main);
  white-space: nowrap;
  border-left: var(--border-width-thick) solid transparent;
  transition: var(--transition-base);

  // --- States ---
  &:hover:not(.is-disabled):not(.is-placeholder),
  &.is-focused:not(.is-disabled) {
    color: var(--color-category-main);
    border-left-color: var(--color-category-main);
    background-color: glass-color(5%);
    box-shadow: inset 0 0 var(--size-3) theme-color(var(--color-category-main), 30%);
    transform: translateX(2px);
  }

  &.is-selected {
    font-weight: var(--font-weight-bold);
    color: var(--color-category-main);
    border-left-color: var(--color-category-main);
    background-color: glass-color(10%);
    box-shadow: inset 0 0 var(--size-4) theme-color(var(--color-category-main), 40%);
  }

  &.is-disabled {
    color: var(--color-text-muted);
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.3;
  }

  &.is-placeholder {
    color: var(--color-text-muted);
    font-style: italic;
    cursor: default;
  }
}

// Transition
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
