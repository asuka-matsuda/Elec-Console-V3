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

const router = useRouter()
const { login } = useAuth()

const userId = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  errorMessage.value = ''

  const trimmedUserId = userId.value.trim()

  if (!trimmedUserId || !password.value) {
    errorMessage.value = 'ユーザーIDとパスワードを入力してください'

    return
  }

  isLoading.value = true

  try {
    const result = await login(trimmedUserId, password.value)

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
  catch {
    errorMessage.value = '通信エラーが発生しました。ネットワーク接続を確認してください。'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="panel w-full max-w-[480px] min-h-[380px] flex flex-col gap-form-row-gap">
    <h2 class="text-center">Elec-Console V3</h2>

    <hr class="divider is-fade-center">

    <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleLogin">
      <Note v-if="errorMessage" variant="error">{{ errorMessage }}</Note>

      <!-- ユーザーID -->
      <div class="flex flex-col gap-inline-gap">
        <label for="login-userId" class="label">ユーザーID</label>
        <Input id="login-userId" v-model="userId" type="text" placeholder="master" icon="user" trim clearable :disabled="isLoading" autocomplete="username" />
      </div>

      <!-- パスワード -->
      <div class="flex flex-col gap-inline-gap">
        <label for="login-password" class="label">パスワード</label>
        <Input id="login-password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" icon="lock" :disabled="isLoading" autocomplete="current-password">
          <template #suffix>
            <button type="button" tabindex="-1" class="password-toggle-btn" @mousedown.prevent @click="showPassword = !showPassword">
              <Icon :name="showPassword ? 'eye-off' : 'eye'" />
            </button>
          </template>
        </Input>
      </div>

      <Button type="submit" variant="primary" size="lg" block :loading="isLoading">ログインする</Button>
    </form>
  </div>
</template>

<style scoped lang="scss">
.password-toggle-btn {
  display: grid;
  place-items: center;

  padding: var(--space-1);
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
