<script setup lang="ts">
/**
 * login
 * ポータルログインページ
 */
import { ref } from 'vue'

import { useHead, useRouter } from '#app'
import { useAuth } from '~/composables/useAuth'
import { LOGIN_FORM_FIELDS } from '~/constants/constants'

definePageMeta({ layout: 'login', title: 'Elec-Console v2' })
useHead({ title: 'ログイン - Elec-Console' })

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
    router.push('/')
  }
  else {
    errorMessage.value = result.message || 'ログインに失敗しました'
  }
}
</script>

<template>
  <div class="p-panel-pad">
    <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleLogin">
      <p v-if="errorMessage" class="login-page__error m-0 px-3 py-2">
        {{ errorMessage }}
      </p>

      <template v-for="field in LOGIN_FORM_FIELDS" :key="field.id">
        <MoleculesFormGroup :label="field.label">
          <Input
            v-model="formData[field.id]"
            :type="field.type"
            :placeholder="field.placeholder"
            :disabled="isLoading"
          />
        </MoleculesFormGroup>
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
  </div>
</template>

<style scoped lang="scss">
.login-page__error {
  border: var(--border-width-base) solid var(--color-status-danger);
  font-size: var(--font-size-sm);
  color: var(--color-status-danger);
}
</style>
