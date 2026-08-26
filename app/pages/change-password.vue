<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from '#app';
import { useAuth } from '~/composables/useAuth';

definePageMeta({
  layout: 'login' // パスワード変更時はメニュー等への遷移を防ぐためログイン用レイアウトを使用
});

const router = useRouter();
const { currentUser, initAuth } = useAuth();
const password = ref('');
const passwordConfirm = ref('');
const errorMsg = ref('');
const isLoading = ref(false);

const handleChangePassword = async () => {
  errorMsg.value = '';
  if (!password.value || password.value.length < 8) {
    errorMsg.value = 'パスワードは8文字以上で入力してください。';
    return;
  }
  if (password.value !== passwordConfirm.value) {
    errorMsg.value = '確認用パスワードが一致しません。';
    return;
  }

  isLoading.value = true;
  try {
    const { error } = await useFetch('/api/auth/password', {
      method: 'PUT',
      body: { newPassword: password.value }
    });

    if (error.value) {
      errorMsg.value = 'パスワードの変更に失敗しました。';
      isLoading.value = false;
      return;
    }

    // 成功したらフロントの状態フラグを手動で消して遷移させる
    if (currentUser.value) {
      currentUser.value.requirePasswordReset = false;
    }
    router.push('/');
  } catch (e) {
    errorMsg.value = '通信エラーが発生しました。';
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="p-change-password">
    <div class="p-change-password__container">
      <AppPanel title="初回パスワード設定">
        <p class="p-change-password__desc">
          セキュリティのため、システムから配布された初期パスワードを変更してください。
        </p>

        <div v-if="errorMsg" class="p-change-password__error">{{ errorMsg }}</div>

        <div class="p-change-password__form">
          <AppFormGroup label="新しいパスワード (8文字以上)">
            <AppInput v-model="password" type="password" placeholder="新しいパスワード" />
          </AppFormGroup>
          <AppFormGroup label="新しいパスワード (確認用)">
            <AppInput v-model="passwordConfirm" type="password" placeholder="もう一度入力" @keyup.enter="handleChangePassword" />
          </AppFormGroup>
        </div>

        <div class="p-change-password__actions">
          <AppButton variant="primary" :disabled="isLoading" @click="handleChangePassword">
            設定してはじめる
          </AppButton>
        </div>
      </AppPanel>
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-change-password {
  // --- レイアウト ---
  @include flex-center;
  min-height: 100vh;
  padding: var(--space-4);

  &__container {
    width: 100%;
    max-width: 480px;
  }

  &__desc {
    @extend %text-desc;
    color: var(--color-text-muted);
    margin-bottom: var(--space-4);
  }

  &__error {
    color: var(--color-status-danger);
    margin-bottom: var(--space-3);
  }

  &__form {
    @include flex-column(var(--space-3));
    margin-bottom: var(--space-4);
  }

  &__actions {
    @include flex-center;
    width: 100%;
  }
}
</style>
