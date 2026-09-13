<script setup lang="ts">
/**
 * OrganismsDrawer
 * [Organisms] ネイティブの dialog 要素を使用した右サイドスライドイン・ドロワー。
 * 一覧テーブルを見ながら詳細表示や編集を行うためのサイドパネルを提供します。
 */
import { onMounted, ref, watch } from 'vue'

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
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    submitFn?: () => Promise<void>
    submitText?: string
    cancelText?: string
  }>(),
  {
    variant: 'management',
    size: 'md',
    submitText: '保存する',
    cancelText: '閉じる',
  },
)

const dialogRef = ref<HTMLDialogElement | null>(null)
const isSubmitting = ref(false)
const errorMsg = ref('')

const close = () => {
  isOpen.value = false
}

const onNativeClose = () => {
  if (isOpen.value) {
    isOpen.value = false
  }
}

const handleSubmit = async () => {
  if (!props.submitFn) return

  errorMsg.value = ''
  isSubmitting.value = true
  try {
    await props.submitFn()
    isOpen.value = false
  }
  catch (e: unknown) {
    errorMsg.value = (e as Error).message || '処理に失敗しました。'
  }
  finally {
    isSubmitting.value = false
  }
}

watch(
  isOpen,
  (newVal) => {
    if (newVal) {
      errorMsg.value = ''
      if (!dialogRef.value?.open) {
        dialogRef.value?.showModal()
      }
    }
    else {
      if (dialogRef.value?.open) {
        dialogRef.value?.close()
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
</script>

<template>
  <dialog
    ref="dialogRef"
    class="drawer fixed top-0 right-0 h-screen max-h-screen m-0 p-0 w-full border-none outline-none"
    :class="{
      'max-w-[360px]': size === 'sm',
      'max-w-[460px]': size === 'md',
      'max-w-[620px]': size === 'lg',
      'max-w-[800px]': size === 'xl',
      'max-w-full': size === 'full',
    }"
    @close="onNativeClose"
    @click.self="close"
    @cancel.prevent="close"
  >
    <div class="drawer-container flex flex-1 flex-col h-full min-h-0">
      <!-- ヘッダー -->
      <header class="drawer-header flex items-center justify-between p-panel-pad shrink-0">
        <slot name="header">
          <MoleculesSectionHeader
            v-if="title"
            :title="title"
            :icon="icon"
            :variant="variant"
            size="md"
            class="flex-1 min-w-0"
          />
        </slot>
        <AtomsButton
          variant="secondary"
          size="sm"
          class="shrink-0 ml-2"
          @click="close"
        >
          <AtomsIcon name="x" size="sm" />
        </AtomsButton>
      </header>

      <!-- メインコンテンツ -->
      <div class="drawer-body overflow-y-auto flex-1 flex flex-col gap-panel-gap min-h-0 p-panel-pad">
        <div v-if="errorMsg" class="drawer-error px-3 py-2">
          {{ errorMsg }}
        </div>

        <slot />
      </div>

      <!-- フッター -->
      <footer v-if="$slots.footer" class="drawer-footer flex items-center justify-end gap-2 p-panel-pad shrink-0">
        <slot name="footer" />
      </footer>

      <footer v-else-if="submitFn" class="drawer-footer flex items-center justify-end gap-2 p-panel-pad shrink-0">
        <AtomsButton
          variant="secondary"
          :disabled="isSubmitting"
          @click="close"
        >
          {{ cancelText }}
        </AtomsButton>
        <AtomsButton
          variant="primary"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          {{ isSubmitting ? "処理中..." : submitText }}
        </AtomsButton>
      </footer>
    </div>
  </dialog>
</template>

<style scoped lang="scss">
.drawer {
  pointer-events: none;

  transform: translateX(100%);

  display: none;

  margin-right: 0;
  margin-left: auto;

  opacity: 0;

  transition:
    opacity var(--duration-modal) var(--ease-smooth),
    transform var(--duration-modal) var(--ease-smooth),
    overlay var(--duration-modal) allow-discrete,
    display var(--duration-modal) allow-discrete;

  &:not([open]) {
    pointer-events: none;
    display: none;
  }

  &::backdrop {
    opacity: 0;
    background-color: rgb(0 0 0 / 45%);
    backdrop-filter: blur(var(--blur-sm));
    transition:
      opacity var(--duration-modal) var(--ease-smooth),
      overlay var(--duration-modal) allow-discrete,
      display var(--duration-modal) allow-discrete;
  }

  &[open] {
    pointer-events: auto;

    transform: translateX(0);

    display: flex;
    flex-direction: column;

    opacity: 1;

    &::backdrop {
      opacity: 1;

      @starting-style {
        opacity: 0;
      }
    }

    @starting-style {
      transform: translateX(100%);
      opacity: 0;
    }
  }
}

.drawer-container {
  border-left: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-2xl, -8px 0 24px rgb(0 0 0 / 50%));
}

.drawer-header {
  border-bottom: var(--border-width-base) solid var(--color-border);
}

.drawer-footer {
  border-top: var(--border-width-base) solid var(--color-border);
}

.drawer-error {
  border: var(--border-width-base) solid var(--color-status-danger);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-xs);
  color: var(--color-status-danger);

  background-color: color-mix(in srgb, var(--color-status-danger) 10%, transparent);
}
</style>
