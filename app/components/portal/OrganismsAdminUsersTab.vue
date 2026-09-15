<script setup lang="ts">
/**
 * PortalOrganismsAdminUsersTab
 * ポータル管理 - ユーザー管理（PC管理コンソール型 2ペインレイアウト）
 * 左ペイン（ユーザー一覧・検索・新規登録）と右ペイン（ユーザー詳細設定・基本情報・現場アサイン）を常時展開します。
 */
import { computed, onMounted, ref, watch } from 'vue'

import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import { useModal } from '~/composables/useModal'
import {
  USER_CREATE_FORM_FIELDS,
  USER_ROLE_OPTIONS,
} from '~/constants/adminConstants'
import type { Site } from '~/types/admin'
import type { User, UserRole } from '~/types/auth'
import { printUserCredential } from '~/utils/printUserCredential'

const { users, fetchUsers, deleteUser, resetUserPassword, createUser, updateUser } = useAdminUsers()
const { sites, fetchSites } = useAdminSites()

const siteList = computed<Site[]>(() => sites.value || [])

onMounted(() => {
  fetchUsers()
  fetchSites()
})

// --- 選択中のユーザー管理 ---
const selectedUserId = ref<string | null>(null)

// usersが読み込まれたら自動的に先頭を選択
watch(
  users,
  (loadedUsers) => {
    if (loadedUsers.length > 0) {
      if (!selectedUserId.value || !loadedUsers.some(u => u.id === selectedUserId.value)) {
        selectedUserId.value = loadedUsers[0]?.id || null
      }
    }
    else {
      selectedUserId.value = null
    }
  },
  { immediate: true },
)

const selectedUser = computed<User | null>(() => {
  if (!selectedUserId.value) return null

  return users.value.find(u => u.id === selectedUserId.value) || null
})

const handleSelectUser = (user: User) => {
  selectedUserId.value = user.id
}

// --- ユーザー情報の保存 ---
const isSaving = ref(false)

const handleSaveUser = async (updates: Partial<User>) => {
  if (!selectedUser.value) return

  isSaving.value = true
  try {
    await updateUser(selectedUser.value.id, updates)
  }
  finally {
    isSaving.value = false
  }
}

// --- 新規登録モーダル ---
const isCreateModalOpen = ref(false)
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

const openCreateModal = () => {
  newUser.value = { ...initialUserState }
  isCreateModalOpen.value = true
}

const handleCreateUser = async () => {
  if (!newUser.value.id || !newUser.value.lastName || !newUser.value.firstName) {
    throw new Error('ID、姓、名を入力してください。')
  }

  const result = await createUser(newUser.value)

  createdUserResult.value = result
  selectedUserId.value = result.id
  isCreateModalOpen.value = false
  isCredentialModalOpen.value = true
}

// --- 認証情報モーダル（新規作成後 & PW初期化後） ---
const isCredentialModalOpen = ref(false)
const createdUserResult = ref<(User & { initialPassword?: string, loginId?: string }) | null>(null)

const handleCopyPassword = () => {
  if (createdUserResult.value?.initialPassword) {
    navigator.clipboard.writeText(createdUserResult.value.initialPassword)
    alert('初期パスワードをコピーしました。')
  }
}

const handlePrint = () => {
  if (createdUserResult.value) {
    printUserCredential({
      lastName: createdUserResult.value.lastName,
      firstName: createdUserResult.value.firstName,
      loginId: createdUserResult.value.loginId || createdUserResult.value.id,
      initialPassword: createdUserResult.value.initialPassword,
    })
  }
}

// --- 削除 & パスワード初期化 確認モーダル ---
const { askConfirm } = useModal()

const confirmDelete = async (row: User) => {
  if (row.id === 'master') {
    alert('マスターユーザーは削除できません。')

    return
  }
  const isConfirmed = await askConfirm({
    title: 'ユーザー削除',
    message: `ユーザー「${row.lastName || ''} ${row.firstName || ''}」を削除してもよろしいですか？`,
    confirmText: '削除する',
    intent: 'danger',
  })

  if (isConfirmed) {
    await deleteUser(row.id)
  }
}

const confirmResetPassword = async (row: User) => {
  const isConfirmed = await askConfirm({
    title: 'パスワード初期化',
    message: `ユーザー「${row.lastName || ''} ${row.firstName || ''}」のパスワードを強制的に初期化し、新しい初期パスワードを発行しますか？`,
    confirmText: '初期化する',
    intent: 'danger',
  })

  if (isConfirmed) {
    try {
      const newPassword = await resetUserPassword(row.id)

      createdUserResult.value = {
        ...row,
        initialPassword: newPassword,
      }
      isCredentialModalOpen.value = true
    }
    catch (e: unknown) {
      alert((e as Error).message)
    }
  }
}
</script>

<template>
  <AtomsPanel>
    <div class="flex flex-col lg:flex-row gap-6 items-start">
      <!-- 左ペイン: Master (幅約340px) -->
      <div class="w-full lg:w-[340px] shrink-0">
        <PortalOrganismsUserListMaster
          :users="users"
          :selected-user-id="selectedUserId"
          @select="handleSelectUser"
          @create="openCreateModal"
        />
      </div>

      <div class="pane-divider hidden lg:block w-px self-stretch" />

      <!-- 右ペイン: Detail (残りワイド領域) -->
      <div class="flex-1 min-w-0 w-full">
        <PortalOrganismsUserSettingsDetail
          :user="selectedUser"
          :site-list="siteList"
          :is-saving="isSaving"
          @save="handleSaveUser"
          @reset-password="confirmResetPassword"
          @delete="confirmDelete"
        />
      </div>
    </div>

    <!-- 新規登録モーダル (中央ダイアログ) -->
    <OrganismsModal
      v-model="isCreateModalOpen"
      title="新規ユーザー登録"
      icon="plus-circle"
      size="md"
      :submit-fn="handleCreateUser"
      submit-text="登録する"
      @cancel="isCreateModalOpen = false"
    >
      <div class="flex flex-col gap-4">
        <template v-for="field in USER_CREATE_FORM_FIELDS" :key="field.id">
          <MoleculesFormGroup :label="field.label">
            <AtomsInput
              v-model="newUser[field.id]"
              :placeholder="field.placeholder"
            />
          </MoleculesFormGroup>
        </template>

        <MoleculesFormGroup label="権限">
          <AtomsSelect v-model="newUser.role" :options="USER_ROLE_OPTIONS" />
        </MoleculesFormGroup>
        <MoleculesFormGroup>
          <AtomsCheckbox
            v-model="newUser.requirePasswordReset"
            label="初回ログイン時にパスワード変更を要求する"
          />
        </MoleculesFormGroup>
      </div>
    </OrganismsModal>

    <!-- 認証情報発行完了モーダル (中央ダイアログ) -->
    <OrganismsModal
      v-model="isCredentialModalOpen"
      title="認証情報の発行完了"
      icon="check-circle"
      variant="success"
      size="md"
      @cancel="isCredentialModalOpen = false"
    >
      <div class="flex flex-col gap-4">
        <p class="credential-desc">
          以下のログイン情報を作業員へお伝えください。<br />
          （初期パスワードはこの画面を閉じると二度と表示されません）
        </p>

        <AtomsPanel v-if="createdUserResult" class="flex flex-col gap-3">
          <MoleculesFormGroup label="氏名">
            <div class="user-value">
              {{ createdUserResult.lastName }} {{ createdUserResult.firstName }}
            </div>
          </MoleculesFormGroup>
          <MoleculesFormGroup label="ログインID">
            <div class="user-value is-mono">
              {{ createdUserResult.loginId || createdUserResult.id }}
            </div>
          </MoleculesFormGroup>
          <MoleculesFormGroup label="初期パスワード">
            <div class="user-value is-mono is-success">
              {{ createdUserResult.initialPassword || "（既に設定済みです）" }}
            </div>
          </MoleculesFormGroup>
        </AtomsPanel>
      </div>

      <template #footer>
        <AtomsButton
          variant="secondary"
          @click="handleCopyPassword"
        >
          PWをコピー
        </AtomsButton>
        <AtomsButton
          variant="secondary"
          @click="handlePrint"
        >
          印刷する
        </AtomsButton>
        <AtomsButton
          variant="primary"
          @click="isCredentialModalOpen = false"
        >
          完了
        </AtomsButton>
      </template>
    </OrganismsModal>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.pane-divider {
  background: var(--color-border);
}

.credential-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.user-value {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);

  &.is-mono {
    font-family: var(--font-mono);
  }

  &.is-success {
    color: var(--color-status-success);
  }
}
</style>
