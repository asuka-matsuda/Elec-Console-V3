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

  try {
    const result = await changePassword(password.value)

    if (result.success) {
      router.push('/')
    }
    else {
      errorMessage.value = result.message || 'パスワードの変更に失敗しました。'
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
  <div class="panel w-full max-w-[480px] flex flex-col gap-form-row-gap">
    <div class="flex flex-col gap-inline-gap">
      <h2 class="text-center">初回パスワード設定</h2>
      <small class="subtitle-text text-center">セキュリティのため、システムから配布された初期パスワードを変更してください。</small>
    </div>

    <hr class="divider is-fade-center">

    <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleChangePassword">
      <Note v-if="errorMessage" variant="error">{{ errorMessage }}</Note>

      <!-- 新しいパスワード -->
      <div class="flex flex-col gap-inline-gap">
        <label for="new-password" class="label">新しいパスワード (8文字以上)</label>
        <Input id="new-password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="新しいパスワード" icon="lock" :disabled="isLoading" autocomplete="new-password">
          <template #suffix>
            <button type="button" tabindex="-1" class="password-toggle-btn" @mousedown.prevent @click="showPassword = !showPassword">
              <Icon :name="showPassword ? 'eye-off' : 'eye'" />
            </button>
          </template>
        </Input>
      </div>

      <!-- 新しいパスワード (確認用) -->
      <div class="flex flex-col gap-inline-gap">
        <label for="confirm-password" class="label">新しいパスワード (確認用)</label>
        <Input id="confirm-password" v-model="passwordConfirm" :type="showPasswordConfirm ? 'text' : 'password'" placeholder="もう一度入力" icon="lock" :disabled="isLoading" autocomplete="new-password">
          <template #suffix>
            <button type="button" tabindex="-1" class="password-toggle-btn" @mousedown.prevent @click="showPasswordConfirm = !showPasswordConfirm">
              <Icon :name="showPasswordConfirm ? 'eye-off' : 'eye'" />
            </button>
          </template>
        </Input>
      </div>

      <Button type="submit" variant="primary" size="lg" block :loading="isLoading">パスワードを設定して開始する</Button>
    </form>
  </div>
</template>

<style scoped lang="scss">
.subtitle-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

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
