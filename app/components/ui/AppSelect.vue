<script setup lang="ts">
/**
 * AppSelect
 * キーボード操作や画面外へのはみ出し防止機能に対応した、カスタムのセレクトボックスコンポーネント。
 */
import { ref, computed, watch, useId, onMounted, onUnmounted } from "vue";

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
const dropdownStyle = ref<Record<string, string>>({});
const isMounted = ref(false);
const teleportTarget = ref<HTMLElement | string>("body");| "bottom">("bottom");
const dropdownStyle = ref<Record<string, string>>({});
const isMounted = ref(false);

const calculatePlacement = () => {
  if (!selectRef.value) return;

  const rect = selectRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const DROPDOWN_MAX_HEIGHT = 250; // Approximate max height of dropdown

  let placement = props.placement;
  if (!placement) {
    if (spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow) {
      placement = "top";
    } else {
      placement = "bottom";
    }
  }

  dynamicPlacement.value = placement;

  // 画面の絶対位置 (fixed) で座標を指定する
  if (placement === "top") {
    dropdownStyle.value = {
      position: "fixed",
      bottom: `${window.innerHeight - rect.top + 4}px`,
      left: `${rect.left}px`,
      minWidth: `${rect.width}px`
    };
  } else {
    dropdownStyle.value = {
      position: "fixed",
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      minWidth: `${rect.width}px`
    };
  }
};

const handleGlobalScroll = (e: Event) => {
  if (!isOpen.value) return;
  // ドロップダウン内部のスクロールは無視
  const dropdown = document.getElementById(listboxId);
  if (dropdown && dropdown.contains(e.target as Node)) return;
  // 親要素などがスクロールされたら閉じる
  isOpen.value = false;
};

onMounted(() => {
  isMounted.value = true;
  const modal = selectRef.value?.closest('dialog');
  if (modal) {
    teleportTarget.value = modal as HTMLElement;
  }
  window.addEventListener("scroll", handleGlobalScroll, { capture: true, passive: true });
  window.addEventListener("resize", calculatePlacement, { passive: true });
});
  window.addEventListener("resize", calculatePlacement, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleGlobalScroll, { capture: true });
  window.removeEventListener("resize", calculatePlacement);
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
          <div v-if="isOpen" class="c-custom-select__dropdown" :class="[`is-${dynamicPlacement}`]" :style="dropdownStyle">
            <ul :id="listboxId" class="c-custom-select__list">
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
  // --- 継承 ---
  @extend %text-desc;

  // --- その他 ---
  user-select: none;

  // --- レイアウト・配置 ---
  position: relative;

  // --- ボックスモデル ---
  width: 100%;

  // --- タイポグラフィ ---
  font-family: var(--font-mono);

  // --- モディファイア ---
  &.is-disabled {
    // --- 継承 ---
    @extend %disabled;
  }
}

.c-custom-select__value {
  // --- 継承 ---
  @extend %click-enabled;

  // --- レイアウト・配置 ---
  position: relative;

  // --- その他 ---
  overflow: hidden;

  // --- レイアウト・配置 ---
  @include flex-start;

  // --- ボックスモデル ---
  width: 100%;
  height: var(--size-control-md);
  padding: var(--pad-component);

  // --- タイポグラフィ ---
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;

  // --- その他 ---
  appearance: none; /* Reset button styles */

  @include form-control-base(
    $is-error: ".c-custom-select.is-error &",
    $is-active: "&.is-active, &:focus, &:focus-visible",
    $is-hover: "&:hover:not(:disabled):not(.is-active)"
  );

  /* Arrow icon (down) */

  // --- 疑似要素 ---
  &::after {
    content: "";

    // --- レイアウト・配置 ---
    position: absolute;
    top: 50%;
    right: var(--space-4);

    // --- 視覚効果 ---
    transform: translateY(-50%);

    // --- ボックスモデル ---
    width: var(--size-4);
    height: var(--size-3);

    // --- 視覚効果 ---
    background-image: var(--icon-select-arrow);
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;

    @include state-base;
  }

  // --- モディファイア ---
  &.is-placeholder {
    // --- タイポグラフィ ---
    color: var(--color-text-muted);
  }

  &.is-active {
    // --- 疑似要素 ---
    &::after {
      // --- 視覚効果 ---
      transform: translateY(-50%) rotate(180deg);
    }
  }
}

.c-custom-select__dropdown {
  // --- CSSカスタムプロパティ ---
  --glow-color: theme-color(var(--color-category-main), 20%);

  // --- レイアウト・配置 ---
  position: absolute; // jsのスタイルが当たるまでの初期値
  z-index: 10000; // bodyの直下に移動したためzIndexを高めに設定

  // --- ボックスモデル ---
  width: max-content;
  max-width: 90vw;

  @include border-dim(var(--color-category-main));

  // --- 視覚効果 ---
  background-color: transparent;
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-glow-inset-md), var(--shadow-elevation-md);

  /* Error state dropdown border */

  // --- モディファイア ---
  .c-custom-select.is-error & {
    // --- CSSカスタムプロパティ ---
    --glow-color: theme-color(var(--color-status-danger), 20%);

    // --- ボックスモデル ---
    border-color: theme-color(var(--color-status-danger), 50%);

    // --- 視覚効果 ---
    box-shadow: var(--shadow-glow-inset-md), var(--shadow-elevation-md);
  }
}

.c-custom-select__list {
  // --- CSSカスタムプロパティ ---
  --scrollbar-size: var(--size-2);

  scrollbar-color: var(--color-category-main) transparent;
  scrollbar-width: thin;

  // --- 視覚効果 ---
  transform: translateZ(0);

  // --- その他 ---
  overflow: hidden auto;

  // --- ボックスモデル ---
  width: 100%;
  max-height: min(250px, 40vh); /* 画面が小さい場合にも対応 */

  list-style: none;
}

.c-custom-select__option {
  // --- 継承 ---
  @extend %click-enabled;

  @extend %text-desc;

  // --- その他 ---
  overflow: hidden;

  // --- ボックスモデル ---
  padding: var(--pad-component);
  border-left: var(--border-width-thick) solid transparent;

  text-overflow: ellipsis;

  // --- タイポグラフィ ---
  white-space: nowrap;

  // --- 視覚効果 ---
  @include state-base;

  // --- 疑似クラス ---
  &:hover:not(.is-disabled, .is-placeholder),
  &.is-focused:not(.is-disabled) {
    // --- CSSカスタムプロパティ ---
    --glow-color: theme-color(var(--color-category-main), 30%);

    // --- 視覚効果 ---
    transform: translateX(2px);

    border-left-color: var(--color-category-main);

    // --- タイポグラフィ ---
    color: var(--color-category-main);

    // --- 視覚効果 ---
    background-color: transparent;
    box-shadow: var(--shadow-glow-inset-md);
  }

  // --- モディファイア ---
  &.is-selected {
    // --- CSSカスタムプロパティ ---
    --glow-color: theme-color(var(--color-category-main), 40%);

    border-left-color: var(--color-category-main);

    // --- タイポグラフィ ---
    color: var(--color-category-main);

    // --- 視覚効果 ---
    background-color: transparent;
    box-shadow: var(--shadow-glow-inset-lg);
  }

  &.is-disabled {
    // --- 継承 ---
    @extend %disabled;
  }

  &.is-placeholder {
    // --- その他 ---
    cursor: default;
    font-style: italic;

    // --- タイポグラフィ ---
    color: var(--color-text-muted);
  }
}
</style>

<style lang="scss">
// --- Dropdown Fade (Global for Teleport) ---
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
