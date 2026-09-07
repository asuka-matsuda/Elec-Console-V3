<script setup lang="ts">
/**
 * login
 * ポータルログインページ
 */
import { ref } from 'vue'

import { useHead, useRouter } from '#app'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: 'login', title: 'Elec-Console v2' })
useHead({ title: 'ログイン - Elec-Console' })

const router = useRouter()
const { login } = useAuth()

const formFields = [
  { id: 'userId', label: 'ユーザーID', type: 'text', placeholder: 'master' },
  {
    id: 'password',
    label: 'パスワード',
    type: 'password',
    placeholder: '••••••••',
  },
] as const

const formData = ref<Record<string, string>>({
  userId: '',
  password: '',
})
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  errorMessage.value = ''
  if (!formData.value.userId || !formData.value.password) {
    errorMessage.value = 'IDとパスワードを入力してください'

    return
  }

  isLoading.value = true
  const result = await login(formData.value.userId, formData.value.password)

  isLoading.value = false

  if (result.success) {
    router.push('/')
  }
  else {
    errorMessage.value = result.message || 'ログインに失敗しました'
  }
}
</script>

<template>
  <div class="p-login">
    <form class="p-login__form" @submit.prevent="handleLogin">
      <p v-if="errorMessage" class="p-login__error" role="alert">
        {{ errorMessage }}
      </p>

      <template v-for="field in formFields" :key="field.id">
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
        <AppButton type="submit" variant="primary" block :disabled="isLoading">
          <template v-if="isLoading"> ログイン中... </template>
          <template v-else> ログイン </template>
        </AppButton>
      </div>
    </form>
  </div>
</template>

<style scoped lang="scss">
.p-login {
  padding: var(--space-card-pad);

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-form-row-gap);
  }

  &__error {
    margin: 0;
    padding: var(--space-2) var(--space-3);
    border: var(--border-width-base) solid var(--color-status-danger);
    border-radius: var(--radius-sm);

    font-size: var(--font-size-sm);
    color: var(--color-status-danger);
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
