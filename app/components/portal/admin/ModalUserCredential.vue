<script setup lang="ts">
/**
 * ModalUserCredential
 * [Portal Organisms] ユーザー新規作成時およびパスワード初期化時に表示する認証情報モーダル。
 * パスワードのコピー・印刷責務を集約します。
 */
import { ref, watch } from 'vue'

import type { User } from '~/types/auth'
import { printUserCredential } from '~/utils/printUserCredential'

const props = defineProps<{
  modelValue: boolean
  user: (User & { initialPassword?: string, loginId?: string }) | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
}>()

const isCopied = ref(false)

watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    isCopied.value = false
  }
})

const handleCopyPassword = async () => {
  if (props.user?.initialPassword) {
    try {
      await navigator.clipboard.writeText(props.user.initialPassword)
      isCopied.value = true
      setTimeout(() => {
        isCopied.value = false
      }, 2000)
    }
    catch {
      alert('初期パスワードをコピーできませんでした。')
    }
  }
}

const handlePrint = () => {
  if (props.user) {
    printUserCredential({
      lastName: props.user.lastName,
      firstName: props.user.firstName,
      loginId: props.user.loginId || props.user.id,
      initialPassword: props.user.initialPassword,
    })
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    title="認証情報の発行完了"
    icon="check-circle"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #actions>
      <Button
        variant="success"
        @click="emit('update:modelValue', false)"
      >
        完了
      </Button>
    </template>

    <div v-if="user" class="flex flex-col gap-4">
      <p class="credential-desc">
        以下のログイン情報を作業者へお伝えください。<br />
        （初期パスワードはこの画面を閉じると二度と表示されません）
      </p>

      <Panel class="flex flex-col gap-3">
        <FormGroup label="氏名">
          <div class="user-value">
            {{ user.lastName }} {{ user.firstName }}
          </div>
        </FormGroup>

        <FormGroup label="ログインID">
          <div class="user-value user-value-mono">
            {{ user.loginId || user.id }}
          </div>
        </FormGroup>

        <FormGroup label="初期パスワード">
          <div class="flex items-center gap-2">
            <div class="user-value user-value-mono user-value-success flex-1">
              {{ user.initialPassword || "（既に設定済みです）" }}
            </div>
            <Button
              v-if="user.initialPassword"
              :icon="isCopied ? 'check' : 'copy'"
              :variant="isCopied ? 'success' : 'default'"
              size="sm"
              @click="handleCopyPassword"
            >
              {{ isCopied ? 'コピー済' : 'コピー' }}
            </Button>
          </div>
        </FormGroup>
      </Panel>

      <div class="flex justify-end pt-1">
        <Button
          icon="printer"
          @click="handlePrint"
        >
          認証情報を印刷する
        </Button>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.credential-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.user-value {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}

.user-value-mono {
  font-family: var(--font-mono);
}

.user-value-success {
  color: var(--color-status-success);
}
</style>
