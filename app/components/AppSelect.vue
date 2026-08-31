<script setup lang="ts">
/**
 * AppSelect
 * キーボード操作や画面外へのはみ出し防止機能に対応した、カスタムのセレクトボックスコンポーネント。
 */
import { ref, computed, watch, useId, onMounted, onUnmounted } from "vue";
import { useClickOutside } from "~/composables/useClickOutside";

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

const listboxId = useId();
const selectRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const focusedIndex = ref(-1);
const dynamicPlacement = ref<"top" | "bottom">("bottom");
const dropdownStyle = ref<Record<string, string>>({});
const isMounted = ref(false);
const teleportTarget = ref<HTMLElement | string>("body");

useClickOutside(selectRef, () => {
  isOpen.value = false;
});

const selectedOption = computed(() => {
  return props.options.find((opt) => opt.value === model.value);
});

const displayLabel = computed(() => {
  if (!isMounted.value) return props.placeholder || "";
  if (selectedOption.value) return selectedOption.value.label;
  return props.placeholder || "";
});

const isPlaceholder = computed(() => {
  if (!isMounted.value) return !!props.placeholder;
  return !selectedOption.value && !!props.placeholder;
});

const calculatePlacement = () => {
  if (!selectRef.value) return;

  const rect = selectRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const DROPDOWN_MAX_HEIGHT = 250;

  let placement = props.placement;
  if (!placement) {
    if (spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow) {
      placement = "top";
    } else {
      placement = "bottom";
    }
  }

  dynamicPlacement.value = placement;

  if (placement === "top") {
    dropdownStyle.value = {
      position: "fixed",
      bottom: `${window.innerHeight - rect.top + 4}px`,
      left: `${rect.left}px`,
      minWidth: `${rect.width}px`,
    };
  } else {
    dropdownStyle.value = {
      position: "fixed",
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      minWidth: `${rect.width}px`,
    };
  }
};

const handleGlobalScroll = (e: Event) => {
  if (!isOpen.value) return;
  const dropdown = document.getElementById(listboxId);
  if (dropdown && dropdown.contains(e.target as Node)) return;
  isOpen.value = false;
};

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
};

const selectOption = (option: SelectOption) => {
  if (option.disabled) return;
  model.value = option.value;
  isOpen.value = false;
};

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

onMounted(() => {
  isMounted.value = true;
  const modal = selectRef.value?.closest("dialog");
  if (modal) {
    teleportTarget.value = modal as HTMLElement;
  }
  window.addEventListener("scroll", handleGlobalScroll, {
    capture: true,
    passive: true,
  });
  window.addEventListener("resize", calculatePlacement, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleGlobalScroll, { capture: true });
  window.removeEventListener("resize", calculatePlacement);
});
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
        'is-placeholder': isPlaceholder,
        'is-active': isOpen,
      }"
      :disabled="disabled"
      @click="toggleDropdown"
      @keydown="handleKeydown"
    >
      {{ displayLabel }}
    </button>

    <!-- Dropdown Menu -->
    <ClientOnly>
      <Teleport :to="teleportTarget">
        <transition name="dropdown-fade">
          <div
            v-if="isOpen"
            class="c-custom-select__dropdown"
            :class="[`is-${dynamicPlacement}`]"
            :style="dropdownStyle"
          >
            <ul
              :id="listboxId"
              class="c-custom-select__list"
            >
              <li
                v-if="isPlaceholder"
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
                  'is-disabled': option.disabled,
                }"
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
  @include text-desc;

  user-select: none;
  position: relative;
  width: 100%;
  font-family: var(--font-mono);

  &.is-disabled {
    @include disabled;
  }
}

.c-custom-select__value {
  @include click-enabled;

  position: relative;

  overflow: hidden;

  @include flex-start;

  width: 100%;
  height: var(--size-control-md);
  padding: var(--space-control-py-md) calc(var(--space-control-px-md) + var(--icon-size-md) + var(--space-inline-gap-sm)) var(--space-control-py-md) var(--space-control-px-md);

  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;

  @include form-control-base(
    $is-error: ".c-custom-select.is-error &",
    $is-active: "&.is-active, &:focus, &:focus-visible",
    $is-hover: "&:hover:not(:disabled):not(.is-active)"
  );

  &::after {
    content: "";

    position: absolute;
    top: 50%;
    right: var(--space-control-px-md);
    transform: translateY(-50%);

    width: var(--icon-size-md);
    height: var(--icon-size-sm);

    background-image: var(--icon-select-arrow);
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;

    @include state-base;
  }

  &.is-placeholder {
    @include form-placeholder;
  }

  &.is-active {
    &::after {
      transform: translateY(-50%) rotate(180deg);
    }
  }
}

.c-custom-select__dropdown {
  --glow-color: color-mix(in srgb, var(--color-category-main) 20%, transparent);

  position: absolute;
  z-index: var(--z-index-select);

  width: max-content;
  max-width: 90vw;

  @include border-dim(var(--color-category-main));

  background-color: transparent;
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-glow-inset-md), var(--shadow-elevation-md);

  .c-custom-select.is-error & {
    --glow-color: color-mix(in srgb, var(--color-status-danger) 20%, transparent);

    border-color: color-mix(in srgb, var(--color-status-danger) 50%, transparent);
    box-shadow: var(--shadow-glow-inset-md), var(--shadow-elevation-md);
  }
}

.c-custom-select__list {
  --scrollbar-size: var(--space-2);

  scrollbar-color: var(--color-category-main) transparent;
  scrollbar-width: thin;

  transform: translateZ(0);

  overflow: hidden auto;

  width: 100%;
  max-height: min(250px, 40vh);
}

.c-custom-select__option {
  @include click-enabled;
  @include text-desc;
  @include text-truncate;

  padding: var(--space-control-py-md) var(--space-control-px);
  border-left: var(--border-width-thick) solid transparent;

  @include state-base;

  &:hover:not(.is-disabled, .is-placeholder),
  &.is-focused:not(.is-disabled) {
    --glow-color: color-mix(in srgb, var(--color-category-main) 30%, transparent);

    transform: translateX(2px);

    border-left-color: var(--color-category-main);

    color: var(--color-category-main);

    background-color: transparent;
    box-shadow: var(--shadow-glow-inset-md);
  }

  &.is-selected {
    --glow-color: color-mix(in srgb, var(--color-category-main) 40%, transparent);

    border-left-color: var(--color-category-main);
    color: var(--color-category-main);
    background-color: transparent;
    box-shadow: var(--shadow-glow-inset-lg);
  }

  &.is-disabled {
    @include disabled;
  }

  &.is-placeholder {
    cursor: default;
    font-style: italic;
    color: var(--color-text-muted);
  }
}
</style>

<style lang="scss">
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
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
