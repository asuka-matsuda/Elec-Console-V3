<script setup lang="ts">
/**
 * login
 * ポータルログインページ
 */
import { ref } from "vue";
import { useHead, useRouter } from "#app";
import { useAuth } from "~/composables/useAuth";

useHead({ title: "ログイン - Elec-Console" });
definePageMeta({ layout: "login", title: "Elec-Console v2" });

const router = useRouter();
const { login } = useAuth();

const formData = ref<Record<string, string>>({
  userId: "",
  password: "",
});

const formFields = [
  { id: "userId", label: "ユーザーID", type: "text", placeholder: "master" },
  { id: "password", label: "パスワード", type: "password", placeholder: "••••••••" },
] as const;
const errorMessage = ref("");
const isLoading = ref(false);

const handleLogin = async () => {
  errorMessage.value = "";
  if (!formData.value.userId || !formData.value.password) {
    errorMessage.value = "IDとパスワードを入力してください";
    return;
  }

  isLoading.value = true;
  const result = await login(formData.value.userId, formData.value.password);
  isLoading.value = false;

  if (result.success) {
    router.push("/");
  } else {
    errorMessage.value = result.message || "ログインに失敗しました";
  }
};
</script>

<template>
  <div class="p-login">
    <form
      class="p-login__form"
      @submit.prevent="handleLogin"
    >
      <div
        v-if="errorMessage"
        class="p-login__error"
      >
        {{ errorMessage }}
      </div>

      <template
        v-for="field in formFields"
        :key="field.id"
      >
        <AppFormGroup :label="field.label">
          <AppInput
            v-model="formData[field.id]"
            :type="field.type"
            :placeholder="field.placeholder"
            :disabled="isLoading"
          />
        </AppFormGroup>
      </template>

      <div class="p-login__actions">
        <AppButton
          type="submit"
          variant="primary"
          block
          :disabled="isLoading"
        >
          <template v-if="isLoading">
            ログイン中...
          </template>
          <template v-else>
            ログイン
          </template>
        </AppButton>
      </div>
    </form>
  </div>
</template>

<style scoped lang="scss">
.p-login {
  // --- ボックスモデル ---
  padding: var(--space-card-pad);

  // --- 子要素 ---
  &__form {
    @include flex-column(var(--space-stack-gap));
  }

  &__error {
    // --- 継承 ---
    @include text-sm;

    // --- ボックスモデル ---
    padding: var(--space-alert-p);

    // --- タイポグラフィ ---
    color: var(--color-status-danger);

    @include border-base(var(--color-status-danger));
  }

  &__actions {
    @include flex-center;

    width: 100%;
  }
}
</style>
