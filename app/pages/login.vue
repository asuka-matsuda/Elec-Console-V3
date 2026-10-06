<script setup lang="ts">
/**
 * ログイン画面
 * ポータルログインページ
 */
import { ref } from 'vue'

import { useHead, useRouter } from '#app'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: 'login' })
useHead({ title: 'ログイン - Elec-Console' })

const LOGIN_FORM_FIELDS = [
  { id: 'userId', label: 'ユーザーID', type: 'text', placeholder: 'master' },
  {
    id: 'password',
    label: 'パスワード',
    type: 'password',
    placeholder: '••••••••',
  },
] as const

const router = useRouter()
const { login } = useAuth()

const formData = ref<Record<string, string>>({
  userId: '',
  password: '',
})
const showPassword = ref(false)
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
    if (result.mustChangePassword) {
      router.push('/change-password')
    }
    else {
      router.push('/')
    }
  }
  else {
    errorMessage.value = result.message || 'ログインに失敗しました'
  }
}
</script>

<template>
  <div class="panel w-full max-w-[480px] flex flex-col gap-form-row-gap">
    <header>
      <h2 class="text-center">
        Elec-Console V3
      </h2>
    </header>
    <hr class="divider">

    <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleLogin">
      <Note v-if="errorMessage" variant="error">{{ errorMessage }}</Note>

      <template v-for="field in LOGIN_FORM_FIELDS" :key="field.id">
        <div class="flex flex-col gap-inline-gap">
          <label :for="`login-${field.id}`" class="label">{{ field.label }}</label>
          <div v-if="field.id === 'password'" class="relative flex items-center">
            <Input :id="`login-${field.id}`" v-model="formData[field.id]" :type="showPassword ? 'text' : 'password'" :placeholder="field.placeholder" :disabled="isLoading" autocomplete="current-password" class="password-input" />
            <button type="button" tabindex="-1" class="password-toggle-btn" @click="showPassword = !showPassword">
              <Icon :name="showPassword ? 'eye-off' : 'eye'" />
            </button>
          </div>
          <Input v-else :id="`login-${field.id}`" v-model="formData[field.id]" :type="field.type" :placeholder="field.placeholder" :disabled="isLoading" autocomplete="username" />
        </div>
      </template>

      <div class="flex items-center justify-center">
        <Button type="submit" variant="primary" size="lg" block :loading="isLoading">ログインする</Button>
      </div>
    </form>
  </div>
</template>

<style scoped lang="scss">
.password-input {
  padding-inline-end: 2.4em;
}

.password-toggle-btn {
  position: absolute;
  right: 0.75em;

  display: grid;
  place-items: center;

  padding: 0.25em;
  border: none;

  color: var(--color-text-muted);

  background: transparent;

  transition: color var(--transition-fast);

  @include state-interactive;

  &:hover {
    color: var(--color-text-main);
  }

  &:focus-visible {
    color: var(--theme-accent);
    outline: none;
  }
}
</style>
