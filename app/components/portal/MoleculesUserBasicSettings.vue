<script setup lang="ts">
/**
 * MoleculesUserBasicSettings
 * [Portal Molecules] ユーザー管理の基本情報設定セクション。
 * 氏名（漢字・かな）、ログインID、権限ロール、パスワード変更要求、最終ログイン日時の編集・表示を提供します。
 */
import { USER_ROLE_OPTIONS } from '~/constants/adminConstants'
import type { User, UserRole } from '~/types/auth'
import { formatDateTime } from '~/utils/date'

defineProps<{
  user: User
  lastName: string
  firstName: string
  lastNameKana: string
  firstNameKana: string
  userRole: UserRole
  requirePasswordReset: boolean
}>()

const emit = defineEmits<{
  'update:lastName': [val: string]
  'update:firstName': [val: string]
  'update:lastNameKana': [val: string]
  'update:firstNameKana': [val: string]
  'update:userRole': [val: UserRole]
  'update:requirePasswordReset': [val: boolean]
}>()

const handleRoleChange = (val: unknown) => {
  emit('update:userRole', (val as UserRole) ?? 'worker')
}

const formatLastLogin = (user: User) => {
  if (!user.lastLoginAt) return '未ログイン'

  return formatDateTime(user.lastLoginAt as string)
}
</script>

<template>
  <div class="flex flex-col gap-5 max-w-xl">
    <MoleculesSectionHeader
      title="ユーザー基本情報"
      icon="info"
      size="sm"
    />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <MoleculesFormGroup label="姓">
        <Input
          :model-value="lastName"
          placeholder="例: 松田"
          @update:model-value="emit('update:lastName', String($event ?? ''))"
        />
      </MoleculesFormGroup>
      <MoleculesFormGroup label="名">
        <Input
          :model-value="firstName"
          placeholder="例: 飛鳥"
          @update:model-value="emit('update:firstName', String($event ?? ''))"
        />
      </MoleculesFormGroup>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <MoleculesFormGroup label="姓（ふりがな）">
        <Input
          :model-value="lastNameKana"
          placeholder="例: まつだ"
          @update:model-value="emit('update:lastNameKana', String($event ?? ''))"
        />
      </MoleculesFormGroup>
      <MoleculesFormGroup label="名（ふりがな）">
        <Input
          :model-value="firstNameKana"
          placeholder="例: あすか"
          @update:model-value="emit('update:firstNameKana', String($event ?? ''))"
        />
      </MoleculesFormGroup>
    </div>

    <MoleculesFormGroup label="ログインID">
      <Input
        :model-value="user.loginId || user.id"
        disabled
      />
    </MoleculesFormGroup>

    <MoleculesFormGroup label="権限">
      <AtomsSelect
        :model-value="userRole"
        :options="USER_ROLE_OPTIONS"
        :disabled="user.id === 'master'"
        @update:model-value="handleRoleChange"
      />
    </MoleculesFormGroup>

    <MoleculesFormGroup>
      <Checkbox
        :model-value="requirePasswordReset"
        label="次回ログイン時にパスワード変更を要求する"
        @update:model-value="emit('update:requirePasswordReset', !!$event)"
      />
    </MoleculesFormGroup>

    <MoleculesFormGroup label="最終ログイン日時">
      <div class="last-login-text pt-1">
        {{ formatLastLogin(user) }}
      </div>
    </MoleculesFormGroup>
  </div>
</template>

<style scoped lang="scss">
.last-login-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
