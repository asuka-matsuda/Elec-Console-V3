<script setup lang="ts">
import { ref } from "vue";

import { useRouter } from "#app";
import { useAuth } from "~/composables/useAuth";

definePageMeta({
  layout: "login",
  title: "初回パスワード設定", // パスワード変更時はメニュー等への遷移を防ぐためログイン用レイアウトを使用
});

const router = useRouter();
const { currentUser } = useAuth();
const { $api } = useApi();
const password = ref("");
const passwordConfirm = ref("");
const errorMsg = ref("");
const isLoading = ref(false);

const handleChangePassword = async () => {
  errorMsg.value = "";
  if (!password.value || password.value.length < 8) {
    errorMsg.value = "パスワードは8文字以上で入力してください。";

    return;
  }
  if (password.value !== passwordConfirm.value) {
    errorMsg.value = "確認用パスワードが一致しません。";

    return;
  }

  isLoading.value = true;
  try {
    await $api("/api/auth/password", {
      method: "PUT",
      body: { newPassword: password.value },
    });

    // 成功したらフロントの状態フラグを手動で消して遷移させる
    if (currentUser.value) {
      currentUser.value.requirePasswordReset = false;
    }
    router.push("/");
  } catch (err: any) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    errorMsg.value =
      err.data?.statusMessage ||
      err.data?.message ||
      "パスワードの変更に失敗しました。";
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="p-change-password">
    <div>
      <p class="p-change-password__desc">
        セキュリティのため、システムから配布された初期パスワードを変更してください。
      </p>

      <div v-if="errorMsg" class="p-change-password__error">
        {{ errorMsg }}
      </div>

      <div class="p-change-password__form">
        <AppFormGroup label="新しいパスワード (8文字以上)">
          <AppInput
            v-model="password"
            type="password"
            placeholder="新しいパスワード"
          />
        </AppFormGroup>
        <AppFormGroup label="新しいパスワード (確認用)">
          <AppInput
            v-model="passwordConfirm"
            type="password"
            placeholder="もう一度入力"
            @keyup.enter="handleChangePassword"
          />
        </AppFormGroup>
      </div>

      <div class="p-change-password__actions">
        <AppButton
          variant="primary"
          :disabled="isLoading"
          @click="handleChangePassword"
        >
          設定してはじめる
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-change-password {
  @include flex-start-stretch($direction: column);

  gap: var(--space-3);

  &__desc {
    @include text-desc;
  }

  &__error {
    @include text-desc;

    padding: var(--space-2) var(--space-3);
    color: var(--color-status-danger);
  }

  &__form {
    @include flex-start-stretch($direction: column);

    gap: var(--space-3);
  }

  &__actions {
    @include flex-center-center;
  }
}
</style>
