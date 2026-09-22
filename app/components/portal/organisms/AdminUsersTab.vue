<script setup lang="ts">
/**
 * AdminUsersTab
 * [Portal Organisms] ポータル管理 - ユーザー管理（PC管理コンソール型 2ペインレイアウト）
 * 左ペイン（ユーザー一覧・検索・新規登録）と右ペイン（ユーザー詳細設定）を常時展開します。
 */
import { useAdminUsersTab } from '~/composables/admin/useAdminUsersTab'
import {
  USER_CREATE_FORM_FIELDS,
  USER_ROLE_OPTIONS,
} from '~/constants/adminConstants'

const {
  users,
  sites,
  selectedUserId,
  selectedUser,
  isSaving,
  handleSaveUser,
  isCredentialModalOpen,
  credentialTarget,
  isCreateModalOpen,
  isCreatingUser,
  createErrorMsg,
  newUser,
  openCreateModal,
  handleCreateUser,
  confirmDelete,
  confirmResetPassword,
} = useAdminUsersTab()
</script>

<template>
  <Panel>
    <div class="flex flex-col lg:flex-row gap-6 items-start">

      <div class="w-full lg:w-[340px] shrink-0">
        <PortalUserListMaster
          :users="users"
          :selected-user-id="selectedUserId"
          @select="selectedUserId = $event.id"
          @create="openCreateModal"
        />
      </div>

      <Divider
        orientation="vertical"
        class="hidden lg:block self-stretch"
      />

      <div class="flex-1 min-w-0 w-full">
        <PortalUserSettingsDetail
          :user="selectedUser"
          :site-list="sites"
          :is-saving="isSaving"
          @save="handleSaveUser"
          @reset-password="confirmResetPassword"
          @delete="confirmDelete"
        />
      </div>
    </div>

    <Modal
      v-model="isCreateModalOpen"
      title="新規ユーザー登録"
      icon="plus-circle"
    >
      <template #actions>
        <Button @click="isCreateModalOpen = false">
          キャンセル
        </Button>
        <Button
          variant="success"
          :loading="isCreatingUser"
          @click="handleCreateUser"
        >
          登録する
        </Button>
      </template>

      <div class="flex flex-col gap-4">
        <Alert
          v-if="createErrorMsg"
          variant="danger"
        >
          {{ createErrorMsg }}
        </Alert>

        <FormGroup
          v-for="field in USER_CREATE_FORM_FIELDS"
          :key="field.id"
          :label="field.label"
        >
          <Input
            v-model="newUser[field.id]"
            :placeholder="field.placeholder"
          />
        </FormGroup>

        <FormGroup label="権限">
          <Select v-model="newUser.role" :options="USER_ROLE_OPTIONS" />
        </FormGroup>
        <FormGroup>
          <Checkbox
            v-model="newUser.requirePasswordReset"
            label="初回ログイン時にパスワード変更を要求する"
          />
        </FormGroup>
      </div>
    </Modal>

    <PortalUserCredentialModal
      v-model="isCredentialModalOpen"
      :user="credentialTarget"
    />
  </Panel>
</template>
