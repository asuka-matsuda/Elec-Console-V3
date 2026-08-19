<script setup lang="ts">
const isOpen = defineModel<boolean>({ default: false });
defineProps<{
  title?: string;
  message?: string;
}>();

defineEmits(['confirm']);
</script>

<template>
  <AppModal
    v-model="isOpen"
    :title="title || 'リセットの確認'"
  >
    <p class="u-text-center">{{ message || '入力した条件をすべてリセットしますか？' }}</p>
    <template #footer>
      <AppButton variant="secondary" @click="isOpen = false">キャンセル</AppButton>
      <AppButtonDanger @click="$emit('confirm')">リセットする</AppButtonDanger>
    </template>
  </AppModal>
</template>
