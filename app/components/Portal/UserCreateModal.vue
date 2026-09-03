<script setup lang="ts">
import { ref } from 'vue'

import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import type { User, UserRole } from '~/types/auth'

const isOpen = defineModel<boolean>({ default: false })
const emit = defineEmits<{
  (e: 'success', user: User): void
}>()
const { createUser } = useAdminUsers()

const roleOptions = [
  { value: 'admin', label: '管理者 (admin)' },
  { value: 'worker', label: '作業員 (worker)' },
  { value: 'viewer', label: '閲覧者 (viewer)' },
]

const formFields = [
  { id: 'id', label: '管理ID', placeholder: '例: EMP001' },
  { id: 'lastName', label: '姓', placeholder: '例: 松田' },
  { id: 'lastNameKana', label: '姓（ふりがな）', placeholder: '例: まつだ' },
  { id: 'firstName', label: '名', placeholder: '例: 飛鳥' },
  { id: 'firstNameKana', label: '名（ふりがな）', placeholder: '例: あすか' },
] as const

const initialUserState = {
  id: '',
  lastName: '',
  firstName: '',
  lastNameKana: '',
  firstNameKana: '',
  role: 'worker' as UserRole,
  requirePasswordReset: true,
  assignedSiteIds: [] as string[],
}

const newUser = ref({ ...initialUserState })

const handleCreateUser = async () => {
  const result = await createUser(newUser.value)

  newUser.value = { ...initialUserState }
  emit('success', result)
}
</script>

<template>
  <AppFormModal
    v-model="isOpen"
    title="新規ユーザー登録"
    :submit-fn="handleCreateUser"
    submit-text="登録する"
  >
    <template v-for="field in formFields" :key="field.id">
      <AppFormGroup :label="field.label">
        <AppInput
          v-model="newUser[field.id]"
          :placeholder="field.placeholder"
        />
      </AppFormGroup>
    </template>

    <AppFormGroup label="権限">
      <AppSelect v-model="newUser.role" :options="roleOptions" />
    </AppFormGroup>
    <AppFormGroup>
      <AppCheckbox
        v-model="newUser.requirePasswordReset"
        label="初回ログイン時にパスワード変更を要求する"
      />
    </AppFormGroup>
  </AppFormModal>
</template>
