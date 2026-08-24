<script setup lang="ts">
/**
 * AppConfirmModal
 * 汎用的な確認モーダルコンポーネントです。
 */
import { computed } from "vue";
import AppButton from "./AppButton.vue";
import AppButtonDanger from "./AppButtonDanger.vue";
import AppButtonSuccess from "./AppButtonSuccess.vue";
import AppButtonSecondary from "./AppButtonSecondary.vue";
import AppModal from "./AppModal.vue";

const isOpen = defineModel<boolean>({ default: false });
const props = withDefaults(defineProps<{
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  intent?: "primary" | "danger" | "success";
}>(), {
  intent: "danger",
});

defineEmits(['confirm']);

const confirmButtonComponent = computed(() => {
  if (props.intent === 'danger') return AppButtonDanger;
  if (props.intent === 'success') return AppButtonSuccess;
  return AppButton;
});
</script>

<template>
  <AppModal
    v-model="isOpen"
    :title="title || '確認'"
  >
    <p class="u-text-center">{{ message || '本当によろしいですか？' }}</p>
    <template #footer>
      <AppButtonSecondary @click="isOpen = false">{{ cancelText || 'キャンセル' }}</AppButtonSecondary>
      <component :is="confirmButtonComponent" @click="$emit('confirm')">{{ confirmText || '実行する' }}</component>
    </template>
  </AppModal>
</template>
