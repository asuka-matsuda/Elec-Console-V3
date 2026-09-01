<script setup lang="ts">
/**
 * AppModal
 * ネイティブの dialog 要素を使用した、アクセシビリティ対応のモーダルコンポーネント。
 */
import { computed, onMounted, onUnmounted, ref, useId, watch } from 'vue'

const isOpen = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    icon?: string
    variant?:
      | 'main'
      | 'tool'
      | 'database'
      | 'reference'
      | 'management'
      | 'danger'
      | 'success'
    align?: 'left' | 'center'
  }>(),
  {
    variant: 'main',
  },
)

const modalId = useId()
const titleId = `modal-title-${modalId}`
const dialogRef = ref<HTMLDialogElement | null>(null)
const isClosing = ref(false)
let closeTimeout: ReturnType<typeof setTimeout> | null = null

const typedVariant = computed(() => props.variant as never)

const close = () => {
  isOpen.value = false
}

const onNativeClose = () => {
  if (isOpen.value) {
    isOpen.value = false
  }
}

watch(
  isOpen,
  (newVal) => {
    if (newVal) {
      if (closeTimeout) {
        clearTimeout(closeTimeout)
        closeTimeout = null
      }
      isClosing.value = false
      if (!dialogRef.value?.open) {
        dialogRef.value?.showModal()
      }
    }
    else {
      if (dialogRef.value?.open) {
        isClosing.value = true
        closeTimeout = setTimeout(() => {
          dialogRef.value?.close()
          isClosing.value = false
          closeTimeout = null
        }, 300)
      }
    }
  },
  { flush: 'post' },
)

onMounted(() => {
  if (isOpen.value) {
    dialogRef.value?.showModal()
  }
})

onUnmounted(() => {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
})
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
    <AppPanel
      class="c-modal__panel"
      :bracket-color="typedVariant"
    >
      <!-- Header -->
      <template #header>
        <AppSectionHeader
          :title-id="titleId"
          :title="title"
          :icon="icon"
          :variant="typedVariant"
          divider-type="fade-center"
        >
          <template v-if="$slots.title">
            <slot name="title" />
          </template>
        </AppSectionHeader>
      </template>

      <div class="c-modal__layout">
        <!-- Body -->
        <div
          class="c-modal__body"
          :class="align === 'center' ? 'c-modal__body--align-center' : ''"
        >
          <slot />
        </div>

        <!-- Footer -->
        <footer
          v-if="$slots.footer"
          class="c-modal__footer"
        >
          <slot name="footer" />
        </footer>
      </div>
    </AppPanel>
  </dialog>
</template>

<style scoped lang="scss">
.c-modal {
  transform: translateY(var(--space-2));

  overflow: visible;

  width: 90vw;
  max-width: 500px;
  max-height: 90vh;
  margin: auto;
  border: none;

  opacity: 0;
  outline: none;

  transition:
    opacity var(--duration-modal) var(--ease-smooth),
    transform var(--duration-modal) var(--ease-smooth);

  &::backdrop {
    opacity: 0;
    backdrop-filter: blur(var(--blur-md));
    transition:
      opacity var(--duration-modal) var(--ease-smooth),
      backdrop-filter var(--duration-modal) var(--ease-smooth);
  }

  &[open] {
    transform: translateY(0);
    opacity: 1;

    @starting-style {
      transform: translateY(var(--space-2));
      opacity: 0;
    }

    &::backdrop {
      opacity: 1;

      @starting-style {
        opacity: 0;
      }
    }
  }

  &__panel {
    width: 100%;
    height: 100%;
    max-height: 90vh;
    backdrop-filter: blur(var(--blur-lg));
  }

  &__layout {
    @include flex-column;

    flex: 1;
    min-height: 0;
  }

  &__body {
    --scrollbar-size: var(--space-2);

    @include text-caption;

    overflow-y: auto;
    flex: 1;
    padding: var(--space-card-pad) 0;

    &--align-center {
      text-align: center;
    }
  }

  &__footer {
    @include flex-end;
  }
}
</style>
