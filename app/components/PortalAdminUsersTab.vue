<script setup lang="ts">
/**
 * PortalAdminUsersTab
 * ポータル管理 - ユーザー管理タブ
 * 右サイドドロワー（OrganismsDrawer）により、ユーザー登録・認証情報確認・現場アサインを同一画面内で管理します。
 */
import { computed, onMounted, ref } from 'vue'

import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import {
  ADMIN_USER_COLUMNS,
  USER_CREATE_FORM_FIELDS,
  USER_ROLE_OPTIONS,
} from '~/constants/adminConstants'
import type { Site } from '~/types/admin'
import type { User, UserRole } from '~/types/auth'
import { printUserCredential } from '~/utils/printUserCredential'

const { users, fetchUsers, deleteUser, resetUserPassword, createUser, assignSites } = useAdminUsers()
const { sites, fetchSites } = useAdminSites()

const siteList = computed<Site[]>(() => sites.value || [])

onMounted(() => {
  fetchUsers()
  fetchSites()
})

const {
  sortBy: sortKey,
  sortOrder,
  sortedData: sortedUsers,
  handleSort,
} = useTableSort(users, {
  defaultKey: 'id',
  defaultOrder: 'asc',
})

const formatLastLogin = (row: unknown) => {
  const user = row as User

  if (!user.lastLoginAt) return '未ログイン'

  return formatDateTime(user.lastLoginAt as string)
}

// ドロワー管理 (モード: 'create' | 'credential' | 'assign' | null)
type DrawerMode = 'create' | 'credential' | 'assign' | null
const drawerMode = ref<DrawerMode>(null)
const isDrawerOpen = computed({
  get: () => drawerMode.value !== null,
  set: (val: boolean) => {
    if (!val) drawerMode.value = null
  },
})

// --- 新規登録用ステート ---
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

const openCreateDrawer = () => {
  newUser.value = { ...initialUserState }
  drawerMode.value = 'create'
}

const handleCreateUser = async () => {
  const result = await createUser(newUser.value)

  createdUserResult.value = result
  drawerMode.value = 'credential'
}

// --- 認証情報表示用ステート ---
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

// --- 現場アサイン用ステート ---
const assignTargetUser = ref<User | null>(null)
const assignTargetSiteIds = ref<string[]>([])

const handleOpenAssign = (row: User) => {
  assignTargetUser.value = row
  assignTargetSiteIds.value = [...(row.assignedSiteIds || [])]
  drawerMode.value = 'assign'
}

const handleSaveAssign = async () => {
  if (!assignTargetUser.value) return
  await assignSites(assignTargetUser.value.id, assignTargetSiteIds.value)
}

// --- 確認モーダル（削除・PWリセット） ---
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
      drawerMode.value = 'credential'
    }
    catch (e: unknown) {
      alert((e as Error).message)
    }
  }
}
</script>

<template>
  <AtomsPanel class="admin-users">
    <MoleculesSectionHeader title="ユーザー一覧">
      <template #actions>
        <AtomsButton
          variant="primary"
          icon="plus"
          @click="openCreateDrawer"
        >
          新規ユーザー登録
        </AtomsButton>
      </template>
    </MoleculesSectionHeader>

    <MoleculesTable
      :columns="ADMIN_USER_COLUMNS"
      :data="sortedUsers"
      :sort-by="sortKey"
      :sort-order="sortOrder"
      @sort="handleSort"
    >
      <template #cell-lastName="{ row }">
        {{ row.lastName }} {{ row.firstName }}
      </template>
      <template #cell-role="{ row }">
        <AtomsBadge
          :color="
            row.role === 'admin'
              ? 'var(--color-status-danger)'
              : row.role === 'worker'
                ? 'var(--color-status-success)'
                : 'var(--color-text-muted)'
          "
        >
          {{ row.role }}
        </AtomsBadge>
      </template>
      <template #cell-lastLoginAt="{ row }">
        <div class="admin-users__login-cell">
          <AtomsBadge
            v-if="row.requirePasswordReset"
            color="var(--color-status-danger)"
          >
            PWリセット要求
          </AtomsBadge>
          <span class="admin-users__meta">{{
            formatLastLogin(row)
          }}</span>
        </div>
      </template>
      <template #cell-actions="{ row }">
        <div class="admin-users__actions">
          <AtomsButton
            variant="secondary"
            size="sm"
            @click="handleOpenAssign(row)"
          >
            現場アサイン
          </AtomsButton>
          <AtomsButton
            variant="secondary"
            size="sm"
            @click="confirmResetPassword(row)"
          >
            PW初期化
          </AtomsButton>
          <AtomsButton
            variant="danger"
            size="sm"
            :disabled="row.id === 'master'"
            @click="confirmDelete(row)"
          >
            削除
          </AtomsButton>
        </div>
      </template>
    </MoleculesTable>

    <!-- 右サイドドロワー: ユーザー管理操作を集約 -->
    <OrganismsDrawer
      v-model="isDrawerOpen"
      :title="
        drawerMode === 'create'
          ? '新規ユーザー登録'
          : drawerMode === 'credential'
            ? '認証情報の発行完了'
            : `現場アサイン管理 (${assignTargetUser?.lastName || ''} ${assignTargetUser?.firstName || ''})`
      "
      :icon="
        drawerMode === 'create'
          ? 'plus'
          : drawerMode === 'credential'
            ? 'check'
            : 'edit'
      "
      :submit-fn="
        drawerMode === 'create'
          ? handleCreateUser
          : drawerMode === 'assign'
            ? handleSaveAssign
            : undefined
      "
      :submit-text="drawerMode === 'create' ? '登録する' : 'アサインを保存'"
    >
      <!-- 1. 新規登録モード -->
      <template v-if="drawerMode === 'create'">
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
      </template>

      <!-- 2. 認証情報表示モード -->
      <template v-else-if="drawerMode === 'credential'">
        <div class="flex flex-col gap-4">
          <p class="drawer-desc">
            以下のログイン情報を作業員へお伝えください。<br />
            （初期パスワードはこの画面を閉じると二度と表示されません）
          </p>

          <div v-if="createdUserResult" class="credential-box flex flex-col gap-3 p-4">
            <MoleculesFormGroup label="氏名">
              <div class="credential-value">
                {{ createdUserResult.lastName }} {{ createdUserResult.firstName }}
              </div>
            </MoleculesFormGroup>
            <MoleculesFormGroup label="ログインID">
              <div class="credential-value font-mono">
                {{ createdUserResult.loginId || createdUserResult.id }}
              </div>
            </MoleculesFormGroup>
            <MoleculesFormGroup label="初期パスワード">
              <div class="credential-value font-mono text-[var(--color-status-success)]">
                {{ createdUserResult.initialPassword || "（既に設定済みです）" }}
              </div>
            </MoleculesFormGroup>
          </div>
        </div>
      </template>

      <!-- 3. 現場アサインモード -->
      <template v-else-if="drawerMode === 'assign'">
        <div class="flex flex-col gap-3">
          <p class="drawer-desc">
            このユーザーが参加・閲覧できる現場を選択してください。
          </p>

          <div class="flex flex-col gap-2">
            <template v-for="site in siteList" :key="site.id">
              <MoleculesFormGroup>
                <AtomsCheckbox
                  v-model="assignTargetSiteIds"
                  :value="site.id"
                  :label="site.name"
                />
              </MoleculesFormGroup>
            </template>
          </div>
        </div>
      </template>

      <!-- フッターのカスタマイズ (credentialモード時) -->
      <template v-if="drawerMode === 'credential'" #footer>
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
          @click="isDrawerOpen = false"
        >
          完了
        </AtomsButton>
      </template>
    </OrganismsDrawer>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.admin-users {
  &__login-cell {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    align-items: center;
  }

  &__actions {
    display: flex;
    flex-wrap: nowrap;
    gap: var(--space-2);
    align-items: center;
    justify-content: center;

    white-space: nowrap;
  }

  &__meta {
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
  }
}

.drawer-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.credential-box {
  border: var(--border-width-base) solid color-mix(in srgb, var(--theme-accent) 30%, transparent);
  border-radius: var(--radius-sm);
  background-color: color-mix(in srgb, var(--surface-bg) 60%, transparent);
}

.credential-value {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}
</style>
