<script setup lang="ts">
/**
 * 初回パスワード変更画面
 * /change-password
 */
import { ref } from 'vue'

import { useHead, useRouter } from '#app'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: 'login' })
useHead({ title: '初回パスワード設定 - Elec-Console' })

const router = useRouter()
const { changePassword } = useAuth()

const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

const handleChangePassword = async () => {
  errorMessage.value = ''
  if (!password.value || password.value.length < 8) {
    errorMessage.value = 'パスワードは8文字以上で入力してください。'

    return
  }
  if (password.value !== passwordConfirm.value) {
    errorMessage.value = '確認用パスワードが一致しません。'

    return
  }

  isLoading.value = true
  const result = await changePassword(password.value)

  isLoading.value = false

  if (result.success) {
    router.push('/')
  }
  else {
    errorMessage.value = result.message || 'パスワードの変更に失敗しました。'
  }
}
</script>

<template>
  <div class="panel w-full max-w-[480px] flex flex-col gap-form-row-gap">
    <header class="flex flex-col gap-inline-gap">
      <h2 class="text-center">
        初回パスワード設定
      </h2>
      <small class="subtitle-text text-center">セキュリティのため、システムから配布された初期パスワードを変更してください。</small>
    </header>
    <hr class="divider">

    <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleChangePassword">

      <div class="flex flex-col gap-inline-gap">
        <label for="new-password" class="label">新しいパスワード (8文字以上)</label>
        <div class="relative flex items-center">
          <Input id="new-password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="新しいパスワード" :disabled="isLoading" autocomplete="new-password" class="password-input" />
          <button type="button" tabindex="-1" class="password-toggle-btn" @click="showPassword = !showPassword">
            <Icon :name="showPassword ? 'eye-off' : 'eye'" />
          </button>
        </div>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      </div>

      <div class="flex flex-col gap-inline-gap">
        <label for="confirm-password" class="label">新しいパスワード (確認用)</label>
        <div class="relative flex items-center">
          <Input id="confirm-password" v-model="passwordConfirm" :type="showPasswordConfirm ? 'text' : 'password'" placeholder="もう一度入力" :disabled="isLoading" autocomplete="new-password" class="password-input" />
          <button type="button" tabindex="-1" class="password-toggle-btn" @click="showPasswordConfirm = !showPasswordConfirm">
            <Icon :name="showPasswordConfirm ? 'eye-off' : 'eye'" />
          </button>
        </div>
      </div>

      <Button type="submit" variant="primary" size="lg" block :loading="isLoading">パスワードを設定して開始する</Button>
    </form>
  </div>
</template>

<style scoped lang="scss">
.error-text {
  font-size: var(--font-size-xs);
  color: var(--color-status-danger);
}

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

.subtitle-text {
  color: var(--color-text-secondary);
}
</style>
