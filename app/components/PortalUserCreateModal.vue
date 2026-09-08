<script setup lang="ts">
import { ref } from 'vue'

import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import {
  USER_CREATE_FORM_FIELDS,
  USER_ROLE_OPTIONS,
} from '~/constants/adminConstants'
import type { User, UserRole } from '~/types/auth'

const isOpen = defineModel<boolean>({ default: false })
const emit = defineEmits<{
  (e: 'success', user: User): void
}>()
const { createUser } = useAdminUsers()

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
  <AppModal
    v-model="isOpen"
    title="新規ユーザー登録"
    :submit-fn="handleCreateUser"
    submit-text="登録する"
  >
    <template v-for="field in USER_CREATE_FORM_FIELDS" :key="field.id">
      <AppFormGroup :label="field.label">
        <AtomsInput
          v-model="newUser[field.id]"
          :placeholder="field.placeholder"
        />
      </AppFormGroup>
    </template>

    <AppFormGroup label="権限">
      <AppSelect v-model="newUser.role" :options="USER_ROLE_OPTIONS" />
    </AppFormGroup>
    <AppFormGroup>
      <AtomsCheckbox
        v-model="newUser.requirePasswordReset"
        label="初回ログイン時にパスワード変更を要求する"
      />
    </AppFormGroup>
  </AppModal>
</template>
