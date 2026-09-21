<script setup lang="ts">
/**
 * UserBasicSettings
 * [Portal Molecules] ユーザー管理の基本情報設定セクション。
 * 氏名（漢字・かな）、ログインID、権限ロール、パスワード変更要求、最終ログイン日時の編集・表示を提供します。
 */
import { computed } from 'vue'

import { USER_ROLE_OPTIONS } from '~/constants/adminConstants'
import type { User, UserRole } from '~/types/auth'
import { formatDateTime } from '~/utils/date'

const lastName = defineModel<string>('lastName', { required: true })
const firstName = defineModel<string>('firstName', { required: true })
const lastNameKana = defineModel<string>('lastNameKana', { default: '' })
const firstNameKana = defineModel<string>('firstNameKana', { default: '' })
const userRole = defineModel<UserRole>('userRole', { default: 'worker' })
const requirePasswordReset = defineModel<boolean>('requirePasswordReset', { default: false })

const props = defineProps<{
  user: User
}>()

const lastLoginText = computed(() => {
  return props.user.lastLoginAt ? formatDateTime(props.user.lastLoginAt) : '未ログイン'
})
</script>

<template>
  <div class="flex flex-col gap-5 max-w-xl">
    <SectionHeader
      title="ユーザー基本情報"
      icon="info"
      tag="h4"
    />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormGroup label="姓">
        <Input
          v-model="lastName"
          placeholder="例: 松田"
        />
      </FormGroup>
      <FormGroup label="名">
        <Input
          v-model="firstName"
          placeholder="例: 飛鳥"
        />
      </FormGroup>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormGroup label="姓（ふりがな）">
        <Input
          v-model="lastNameKana"
          placeholder="例: まつだ"
        />
      </FormGroup>
      <FormGroup label="名（ふりがな）">
        <Input
          v-model="firstNameKana"
          placeholder="例: あすか"
        />
      </FormGroup>
    </div>

    <FormGroup label="ログインID">
      <Input
        :model-value="user.loginId || user.id"
        disabled
      />
    </FormGroup>

    <FormGroup label="権限">
      <Select
        v-model="userRole"
        :options="USER_ROLE_OPTIONS"
        :disabled="user.id === 'master'"
      />
    </FormGroup>

    <Checkbox
      v-model="requirePasswordReset"
      label="次回ログイン時にパスワード変更を要求する"
    />

    <FormGroup label="最終ログイン日時">
      <div class="last-login-text pt-1">
        {{ lastLoginText }}
      </div>
    </FormGroup>
  </div>
</template>

<style scoped>
.last-login-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
