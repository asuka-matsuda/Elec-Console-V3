<script setup lang="ts">
/**
 * AppFormModal
 * フォーム入力と非同期送信（ローディング・エラー管理）を内包した共通モーダル
 */
import { ref } from 'vue';
import AppModal from './AppModal.vue';
import AppButton from './AppButton.vue';

const isOpen = defineModel<boolean>({ default: false });

const props = withDefaults(defineProps<{
  title: string;
  submitFn: () => Promise<void>;
  submitText?: string;
  cancelText?: string;
}>(), {
  submitText: '保存する',
  cancelText: 'キャンセル',
});

const isSubmitting = ref(false);
const errorMsg = ref('');

const handleSubmit = async () => {
  errorMsg.value = '';
  isSubmitting.value = true;
  try {
    await props.submitFn();
    // 成功した場合は親側でモーダルを閉じるか、ここで閉じる。
    // 一般的には成功時に isOpen = false にする
    isOpen.value = false;
  } catch (e: any) {
    errorMsg.value = e.message || '処理に失敗しました。';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <AppModal v-model="isOpen" :title="title">
    <div class="c-app-form-modal">
      <div v-if="errorMsg" class="c-app-form-modal__error">
        {{ errorMsg }}
      </div>
      
      <div class="c-app-form-modal__body">
        <slot></slot>
      </div>
    </div>
    
    <template #footer>
      <AppButton variant="secondary" :disabled="isSubmitting" @click="isOpen = false">
        {{ cancelText }}
      </AppButton>
      <AppButton variant="primary" :disabled="isSubmitting" @click="handleSubmit">
        {{ isSubmitting ? '処理中...' : submitText }}
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.c-app-form-modal {
  @include flex-column(var(--gap-section));

  &__error {
    color: var(--color-status-danger);
    font-weight: bold;
    padding: var(--pad-component);
    background: transparent;
    backdrop-filter: blur(var(--blur-sm));
    @include border-dim(var(--color-status-danger));
  }

  &__body {
    @include flex-column(var(--gap-section));
  }
}
</style>
