<script setup lang="ts">
import { ref, computed, watch, useId } from "vue";

export interface SelectOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}

const model = defineModel<string | number | boolean | null>();

const props = defineProps<{
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  placement?: "top" | "bottom";
}>();

const isOpen = ref(false);
const selectRef = ref<HTMLElement | null>(null);
const focusedIndex = ref(-1);
const dynamicPlacement = ref<"top" | "bottom">("bottom");

const calculatePlacement = () => {
  if (!selectRef.value) return;
  // If explicitly set via props, respect it
  if (props.placement) {
    dynamicPlacement.value = props.placement;
    return;
  }
  
  const rect = selectRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const DROPDOWN_MAX_HEIGHT = 260; // Approximate max height of dropdown

  if (spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow) {
    dynamicPlacement.value = "top";
  } else {
    dynamicPlacement.value = "bottom";
  }
};

const selectedOption = computed(() => {
  return props.options.find((opt) => opt.value === model.value);
});

const displayLabel = computed(() => {
  if (selectedOption.value) return selectedOption.value.label;
  return props.placeholder || "";
});

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
};

const selectOption = (option: SelectOption) => {
  if (option.disabled) return;
  model.value = option.value;
  isOpen.value = false;
};

// --- Keyboard Navigation ---
const focusNext = () => {
  let nextIndex = focusedIndex.value + 1;
  while (nextIndex < props.options.length) {
    if (!props.options[nextIndex]?.disabled) {
      focusedIndex.value = nextIndex;
      return;
    }
    nextIndex++;
  }
};

const focusPrev = () => {
  let prevIndex = focusedIndex.value - 1;
  while (prevIndex >= 0) {
    if (!props.options[prevIndex]?.disabled) {
      focusedIndex.value = prevIndex;
      return;
    }
    prevIndex--;
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return;

  switch (event.key) {
    case "Delete":
    case "Backspace":
      event.preventDefault();
      model.value = undefined;
      isOpen.value = false;
      break;
    case "Enter":
    case " ":
      event.preventDefault();
      if (isOpen.value) {
        if (
          focusedIndex.value >= 0 &&
          focusedIndex.value < props.options.length
        ) {
          selectOption(props.options[focusedIndex.value]!);
        } else {
          isOpen.value = false;
        }
      } else {
        isOpen.value = true;
      }
      break;
    case "Escape":
      if (isOpen.value) {
        isOpen.value = false;
        event.stopPropagation();
      }
      break;
    case "ArrowDown":
      event.preventDefault();
      if (!isOpen.value) {
        isOpen.value = true;
      } else {
        focusNext();
      }
      break;
    case "ArrowUp":
      event.preventDefault();
      if (!isOpen.value) {
        isOpen.value = true;
      } else {
        focusPrev();
      }
      break;
  }
};

// Reset focus state and calculate placement when dropdown opens
watch(isOpen, (newVal) => {
  if (newVal) {
    calculatePlacement();
    const index = props.options.findIndex((opt) => opt.value === model.value);
    if (index >= 0) {
      focusedIndex.value = index;
    } else {
      focusedIndex.value = -1;
      focusNext();
    }
  } else {
    focusedIndex.value = -1;
  }
});

// --- Click Outside ---
useClickOutside(selectRef, () => {
  isOpen.value = false;
});

const listboxId = useId();
</script>

<template>
  <div
    ref="selectRef"
    class="c-custom-select"
    :class="{ 'is-disabled': disabled, 'is-error': error }"
  >
    <!-- Trigger Element (Changed to button for native focus handling) -->
    <button
      type="button"
      class="c-custom-select__value"
      :class="{
        'is-placeholder': !selectedOption && placeholder,
        'is-active': isOpen,
      }"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      @click="toggleDropdown"
      @keydown="handleKeydown"
    >
      {{ displayLabel }}
    </button>

    <!-- Dropdown Menu -->
    <transition name="dropdown-fade">
      <div v-if="isOpen" class="c-custom-select__dropdown" :class="[`is-${dynamicPlacement}`]">
        <ul :id="listboxId" class="c-custom-select__list" role="listbox">
          <li
            v-if="placeholder && !selectedOption"
            class="c-custom-select__option is-placeholder"
            role="option"
            aria-selected="false"
          >
            {{ placeholder }}
          </li>
          <li
            v-for="(option, index) in options"
            :key="String(option.value)"
            class="c-custom-select__option"
            role="option"
            :aria-selected="model === option.value"
            :class="{
              'is-selected': model === option.value,
              'is-focused': index === focusedIndex,
              'is-disabled': option.disabled,
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
  font-size: var(--font-size-sm);
  color: var(--color-text-main);
  user-select: none;

  &.is-disabled {
    pointer-events: none;
    opacity: 0.5;
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
  padding: var(--space-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @include form-control-base(
    $is-error: ".c-custom-select.is-error &",
    $is-active: "&.is-active, &:focus, &:focus-visible",
    $is-hover: "&:hover:not(:disabled):not(.is-active)"
  );

  appearance: none; /* Reset button styles */
  text-align: left;

  /* Arrow icon (down) */
  &::after {
    position: absolute;
    top: 50%;
    right: var(--space-4);
    width: var(--size-4);
    height: var(--size-3);
    content: "";
    background-image: var(--icon-select-arrow);
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    transform: translateY(-50%);
    transition: var(--transition-base);
  }

  &.is-placeholder {
    color: var(--color-text-muted);
  }

  &.is-active {
    &::after {
      transform: translateY(-50%) rotate(180deg);
    }
  }
}

.c-custom-select__dropdown {
  position: absolute;
  z-index: 100;
  width: max-content;
  min-width: 100%;
  max-width: 90vw;
  background-color: transparent;
  backdrop-filter: blur(var(--blur-md));
  border: var(--border-width-base) solid
    theme-color(var(--color-category-main), 50%);
  box-shadow:
    var(--shadow-elevation-hover),
    inset 0 0 10px theme-color(var(--color-category-main), 20%);

  &.is-bottom {
    top: calc(100% + var(--space-1));
  }

  &.is-top {
    bottom: calc(100% + var(--space-1));
    top: auto;
  }

  /* Error state dropdown border */
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

  --scrollbar-size: var(--size-2);
}

.c-custom-select__option {
  @extend %click-enabled;

  padding: var(--space-2);
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--font-size-sm);
  color: var(--color-text-main);
  white-space: nowrap;
  border-left: var(--border-width-thick) solid transparent;
  transition: var(--transition-base);

  /* --- States --- */
  &:hover:not(.is-disabled, .is-placeholder),
  &.is-focused:not(.is-disabled) {
    color: var(--color-category-main);
    border-left-color: var(--color-category-main);
    background-color: transparent;
    box-shadow: inset 0 0 var(--size-3)
      theme-color(var(--color-category-main), 30%);
    transform: translateX(2px);
  }

  &.is-selected {
    font-weight: var(--font-weight-bold);
    color: var(--color-category-main);
    border-left-color: var(--color-category-main);
    background-color: transparent;
    box-shadow: inset 0 0 var(--size-4)
      theme-color(var(--color-category-main), 40%);
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
</style>
