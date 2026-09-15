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
  <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleChangePassword">
    <p class="change-password-page__lead m-0">
      セキュリティのため、システムから配布された初期パスワードを変更してください。
    </p>

    <p v-if="errorMsg" class="change-password-page__error m-0 px-3 py-2">
      {{ errorMsg }}
    </p>

    <MoleculesFormGroup label="新しいパスワード (8文字以上)">
      <AtomsInput
        v-model="password"
        type="password"
        placeholder="新しいパスワード"
        :disabled="isLoading"
      />
    </MoleculesFormGroup>
    <MoleculesFormGroup label="新しいパスワード (確認用)">
      <AtomsInput
        v-model="passwordConfirm"
        type="password"
        placeholder="もう一度入力"
        :disabled="isLoading"
      />
    </MoleculesFormGroup>

    <div class="flex items-center justify-center">
      <AtomsButton
        type="submit"
        variant="success"
        block
        :disabled="isLoading"
      >
        <template v-if="isLoading"> 設定中... </template>
        <template v-else> 設定してはじめる </template>
      </AtomsButton>
    </div>
  </form>
</template>

<style scoped lang="scss">
.change-password-page {
  &__lead {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__error {
    border: var(--border-width-base) solid var(--color-status-danger);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    color: var(--color-status-danger);
  }
}
</style>
