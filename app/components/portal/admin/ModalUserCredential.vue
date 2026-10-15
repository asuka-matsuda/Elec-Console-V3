<script setup lang="ts">
/**
 * ModalUserCredential
 * [Portal Organisms] ユーザー新規作成時およびパスワード初期化時に表示する認証情報モーダル。
 * パスワードのコピー・印刷責務を集約します。
 */
import { ref, watch } from 'vue'

import type { User } from '#shared/types/auth'
import { printUserCredential } from '~/utils/printUserCredential'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  user: (User & { initialPassword?: string, loginId?: string }) | null
}>()

const isCopied = ref(false)
const toast = useToast()

watch(isOpen, (open) => {
  if (!open) {
    isCopied.value = false
  }
})

const handleCopyPassword = async () => {
  if (props.user?.initialPassword) {
    try {
      await navigator.clipboard.writeText(props.user.initialPassword)
      isCopied.value = true
      toast.success('初期パスワードをクリップボードにコピーしました')
      setTimeout(() => {
        isCopied.value = false
      }, 2000)
    }
    catch {
      toast.danger('初期パスワードをコピーできませんでした。')
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
  <Modal v-model="isOpen" title="認証情報の発行完了" icon="circle-check">
    <template #footer>
      <Button variant="primary" @click="isOpen = false">完了する</Button>
    </template>

    <div v-if="user" class="flex flex-col gap-form-row-gap">
      <p>
        <small>
          以下のログイン情報を作業者へお伝えください。<br />
          （初期パスワードはこの画面を閉じると二度と表示されません）
        </small>
      </p>

      <div class="flex flex-col gap-panel-gap">
        <div class="flex flex-col gap-inline-gap">
          <span class="label">氏名</span>
          <strong>
            {{ user.lastName }} {{ user.firstName }}
          </strong>
        </div>

        <div class="flex flex-col gap-inline-gap">
          <span class="label">ログインID</span>
          <strong>
            <code>{{ user.loginId || user.id }}</code>
          </strong>
        </div>

        <div class="flex flex-col gap-inline-gap">
          <span class="label">初期パスワード</span>
          <div class="flex items-center gap-item-gap">
            <strong class="flex-1" style="color: var(--color-status-success)">
              <code>{{ user.initialPassword || "（既に設定済みです）" }}</code>
            </strong>
            <Button v-if="user.initialPassword" variant="secondary" size="sm" :icon="isCopied ? 'check' : 'copy'" @click="handleCopyPassword">{{ isCopied ? 'コピー完了' : 'パスワードをコピー' }}</Button>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <Button variant="secondary" size="sm" icon="printer" @click="handlePrint">認証情報を印刷する</Button>
      </div>
    </div>
  </Modal>
</template>
