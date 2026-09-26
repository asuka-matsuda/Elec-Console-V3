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
  <Panel class="w-full max-w-[480px] flex flex-col gap-form-row-gap">
    <SectionHeader title="Elec-Console V3" />

    <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleLogin">
      <Alert v-if="errorMessage" variant="danger">
        {{ errorMessage }}
      </Alert>

      <template v-for="field in LOGIN_FORM_FIELDS" :key="field.id">
        <FormGroup :label="field.label">
          <Input
            v-model="formData[field.id]"
            :type="field.type"
            :placeholder="field.placeholder"
            :disabled="isLoading"
            :clearable="field.type !== 'password'"
          />
        </FormGroup>
      </template>

      <div class="flex items-center justify-center">
        <Button
          type="submit"
          variant="success"
          block
          :loading="isLoading"
        >
          ログイン
        </Button>
      </div>
    </form>
  </Panel>
</template>
