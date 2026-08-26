<script setup lang="ts">
/**
 * AppModal
 * ネイティブの dialog 要素を使用した、アクセシビリティ対応のモーダルコンポーネント。
 */
import { useId, ref, watch, onMounted } from "vue";

const isOpen = defineModel<boolean>({ default: false });

withDefaults(
  defineProps<{
    title?: string;
    icon?: string;
    variant?:
      | "main"
      | "tool"
      | "database"
      | "reference"
      | "management"
      | "danger"
      | "success";
    align?: "left" | "center";
  }>(),
  {
    variant: "main",
  },
);

const dialogRef = ref<HTMLDialogElement | null>(null);
const isClosing = ref(false);
let closeTimeout: ReturnType<typeof setTimeout> | null = null;

const close = () => {
  isOpen.value = false;
};

// Handle native close event (e.g., if closed via script or devtools directly)
const onNativeClose = () => {
  if (isOpen.value) {
    isOpen.value = false;
  }
};

/** Watch isOpen to open/close native dialog with animation support */
watch(
  isOpen,
  (newVal) => {
    if (newVal) {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
      isClosing.value = false;
      if (!dialogRef.value?.open) {
        dialogRef.value?.showModal();
      }
    } else {
      if (dialogRef.value?.open) {
        isClosing.value = true;
        closeTimeout = setTimeout(() => {
          dialogRef.value?.close();
          isClosing.value = false;
          closeTimeout = null;
        }, 300); // 300ms matches typical transition duration
      }
    }
  },
  { flush: "post" }
);

/** Support opening dialog initially if isOpen is true */
onMounted(() => {
  if (isOpen.value) {
    dialogRef.value?.showModal();
  }
});

const modalId = useId();
const titleId = `modal-title-${modalId}`;
</script>

<template>
  <dialog
    ref="dialogRef"
    :aria-labelledby="titleId"
    class="c-modal"
    :class="{ 'is-closing': isClosing }"
    @close="onNativeClose"
    @click.self="close"
    @cancel.prevent="close"
  >
    <AppPanel class="c-modal__panel" :bracket-color="(variant as any)">
      <!-- Header -->
      <template #header>
        <AppSectionHeader
          :title-id="titleId"
          :title="title"
          :icon="icon"
          :variant="(variant as any)"
          divider-type="fade-center"
        >
          <template v-if="$slots.title">
            <slot name="title" />
          </template>
        </AppSectionHeader>
      </template>

      <div class="c-modal__layout">
        <!-- Body -->
        <div class="c-modal__body" :class="align === 'center' ? 'c-modal__body--align-center' : ''">
          <slot />
        </div>

        <!-- Footer -->
        <footer v-if="$slots.footer" class="c-modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </AppPanel>
  </dialog>
</template>

<style scoped lang="scss">
.c-modal {
  // --- 視覚効果 ---
  transform: translateY(var(--space-2));

  // --- その他 ---
  overflow: visible;

  /* Sizing based on original AppPanel overlay */

  // --- ボックスモデル ---
  width: 90vw;
  max-width: 500px;
  max-height: 90vh;

  /* Native Dialog Resets */
  margin: auto;
  border: none;

  /* Animation */

  // --- 視覚効果 ---
  opacity: 0;

  // --- ボックスモデル ---
  outline: none;

  // --- 視覚効果 ---
  transition:
    opacity var(--duration-modal) var(--ease-smooth),
    transform var(--duration-modal) var(--ease-smooth);

  /* Native Backdrop Styling */

  // --- 疑似要素 ---
  &::backdrop {
    // --- 視覚効果 ---
    opacity: 0;
    backdrop-filter: blur(var(--blur-md));
    transition:
      opacity var(--duration-modal) var(--ease-smooth),
      backdrop-filter var(--duration-modal) var(--ease-smooth);
  }

  &[open] {
    // --- 視覚効果 ---
    transform: translateY(0);
    opacity: 1;

    @starting-style {
      // --- 視覚効果 ---
      transform: translateY(var(--space-2));
      opacity: 0;
    }

    // --- 疑似要素 ---
    &::backdrop {
      // --- 視覚効果 ---
      opacity: 1;

      @starting-style {
        // --- 視覚効果 ---
        opacity: 0;
      }
    }
  }

  /* Internal Panel */

  // --- 子要素 ---
  &__panel {
    // --- ボックスモデル ---
    width: 100%;
    height: 100%;
    max-height: 90vh;

    // --- 視覚効果 ---
    backdrop-filter: blur(var(--blur-lg));
  }



  &__layout {
    // --- レイアウト・配置 ---
    @include flex-column;

    flex: 1;

    // --- ボックスモデル ---
    min-height: 0;
  }

  &__body {
    // --- CSSカスタムプロパティ ---
    --scrollbar-size: var(--size-2);

    // --- 継承 ---
    @extend %text-caption;

    // --- その他 ---
    overflow-y: auto;

    // --- レイアウト・配置 ---
    flex: 1;

    // --- ボックスモデル ---
    padding: var(--pad-container) 0;

    // --- モディファイア ---
    &--align-center {
      // --- タイポグラフィ ---
      text-align: center;
    }
  }

  &__footer {
    // --- レイアウト・配置 ---
    display: flex;
    gap: var(--gap-element);
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
