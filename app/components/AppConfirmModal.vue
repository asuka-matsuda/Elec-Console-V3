<script setup lang="ts">
/**
 * AppConfirmModal
 * 汎用的な確認モーダルコンポーネントです。
 */
const isOpen = defineModel<boolean>({ default: false })

withDefaults(
  defineProps<{
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    intent?: 'primary' | 'secondary' | 'danger' | 'success'
  }>(),
  {
    intent: 'danger',
  },
)

defineEmits<{
  (e: 'confirm'): void
}>()
</script>

<template>
  <AppModal v-model="isOpen" :title="title || '確認'" align="center">
    {{ message || "本当によろしいですか？" }}
    <template #footer>
      <AppButton variant="secondary" @click="isOpen = false">
        {{ cancelText || "キャンセル" }}
      </AppButton>
      <AppButton :variant="intent" @click="$emit('confirm')">
        {{ confirmText || "実行する" }}
      </AppButton>
    </template>
  </AppModal>
</template>
