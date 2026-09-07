<script setup lang="ts">
import { ref } from 'vue'

import { useRouter } from '#app'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'login',
  title: '初回パスワード設定', // パスワード変更時はメニュー等への遷移を防ぐためログイン用レイアウトを使用
})

const router = useRouter()
const { currentUser } = useAuth()
const { $api } = useApi()
const password = ref('')
const passwordConfirm = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

const handleChangePassword = async () => {
  errorMsg.value = ''
  if (!password.value || password.value.length < 8) {
    errorMsg.value = 'パスワードは8文字以上で入力してください。'

    return
  }
  if (password.value !== passwordConfirm.value) {
    errorMsg.value = '確認用パスワードが一致しません。'

    return
  }

  isLoading.value = true
  try {
    await $api('/api/auth/password', {
      method: 'PUT',
      body: { newPassword: password.value },
    })

    // 成功したらフロントの状態フラグを手動で消して遷移させる
    if (currentUser.value) {
      currentUser.value.requirePasswordReset = false
    }
    router.push('/')
  }
  catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string, message?: string } }

    errorMsg.value
      = fetchErr.data?.statusMessage
        || fetchErr.data?.message
        || 'パスワードの変更に失敗しました。'
    isLoading.value = false
  }
}
</script>

<template>
  <div class="p-change-password">
    <small>
      セキュリティのため、システムから配布された初期パスワードを変更してください。
    </small>

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
</template>

<style scoped lang="scss">
.p-change-password {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  &__error {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-sm);
    color: var(--color-status-danger);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-form-row-gap);
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
