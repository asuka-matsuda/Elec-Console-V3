<script setup lang="ts">
/**
 * AppConfirmModal
 * 汎用的な確認モーダルコンポーネントです。
 */
const isOpen = defineModel<boolean>({ default: false });
defineProps<{
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}>();

defineEmits(['confirm']);
</script>

<template>
  <AppModal
    v-model="isOpen"
    :title="title || '確認'"
  >
    <p class="u-text-center">{{ message || '本当によろしいですか？' }}</p>
    <template #footer>
      <AppButtonSecondary @click="isOpen = false">{{ cancelText || 'キャンセル' }}</AppButtonSecondary>
      <AppButtonDanger @click="$emit('confirm')">{{ confirmText || '実行する' }}</AppButtonDanger>
    </template>
  </AppModal>
</template>
