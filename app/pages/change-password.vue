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
  <Panel class="w-full max-w-[480px] flex flex-col gap-form-row-gap">
    <SectionHeader title="初回パスワード設定" />

    <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleChangePassword">
      <small class="m-0">
        セキュリティのため、システムから配布された初期パスワードを変更してください。
      </small>

      <FormGroup
        label="新しいパスワード (8文字以上)"
        :error="errorMessage"
      >
        <Input
          v-model="password"
          type="password"
          placeholder="新しいパスワード"
          :disabled="isLoading"
        />
      </FormGroup>

      <FormGroup label="新しいパスワード (確認用)">
        <Input
          v-model="passwordConfirm"
          type="password"
          placeholder="もう一度入力"
          :disabled="isLoading"
        />
      </FormGroup>

      <Button
        type="submit"
        variant="success"
        block
        :loading="isLoading"
      >
        設定してはじめる
      </Button>
    </form>
  </Panel>
</template>
