<script setup lang="ts">
/**
 * TabAdminUsers
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
    <div class="flex flex-col lg:flex-row gap-section-gap items-start">

      <aside class="w-full lg:w-[340px] shrink-0">
        <PortalMasterUserList
          :users="users"
          :selected-user-id="selectedUserId"
          @select="selectedUserId = $event.id"
          @create="openCreateModal"
        />
      </aside>

      <Divider
        orientation="vertical"
        class="hidden lg:block self-stretch"
      />

      <section class="flex-1 min-w-0">
        <PortalDetailUserSettings
          :user="selectedUser"
          :site-list="sites"
          :is-saving="isSaving"
          @save="handleSaveUser"
          @reset-password="confirmResetPassword"
          @delete="confirmDelete"
        />
      </section>
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

      <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleCreateUser">
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
          <Select
            v-model="newUser.role"
            :options="USER_ROLE_OPTIONS"
            :clearable="false"
          />
        </FormGroup>
        <FormGroup>
          <Checkbox
            v-model="newUser.requirePasswordReset"
            label="初回ログイン時にパスワード変更を要求する"
          />
        </FormGroup>
      </form>
    </Modal>

    <PortalModalUserCredential
      v-model="isCredentialModalOpen"
      :user="credentialTarget"
    />
  </Panel>
</template>
