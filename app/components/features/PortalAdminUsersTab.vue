<script setup lang="ts">
/**
 * PortalAdminUsersTab
 * ポータル管理 - ユーザー管理タブ
 */
import { ref, onMounted, computed } from "vue";
import { useAdminUsers } from "~/composables/admin/useAdminUsers";
import type { User } from "~/types/auth";

const { users, fetchUsers, deleteUser, resetUserPassword } = useAdminUsers();

onMounted(() => {
  fetchUsers();
});

// --- ユーザー一覧の定義 ---
const userHeaders = [
  { key: "id", label: "ID" },
  { key: "name", label: "名前" },
  { key: "loginId", label: "ログインID" },
  { key: "role", label: "権限", sortable: true },
  { key: "status", label: "ステータス" },
  { key: "actions", label: "操作" },
];


const sortKey = ref('id');
const sortOrder = ref<'asc' | 'desc'>('asc');

const handleSort = (payload: { key: string; order: 'asc' | 'desc' }) => {
  sortKey.value = payload.key;
  sortOrder.value = payload.order;
};

const sortedUsers = computed(() => {
  return [...users.value].sort((a, b) => {
    // 氏名カラムの場合は lastName を基準にする
    const key = sortKey.value === 'name' ? 'lastName' : sortKey.value;
    const valA = a[key as keyof typeof a];
    const valB = b[key as keyof typeof b];
    
    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    
    const cmp = String(valA).localeCompare(String(valB));
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
});

const formatLastLogin = (row: unknown) => {
  const user = row as User;
  if (!user.lastLoginAt) return "未ログイン";
  
  return new Date(user.lastLoginAt as string).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).replace(/\//g, "/");
};

// --- モーダルステート管理 ---
const isCreateModalOpen = ref(false);
const isCredentialModalOpen = ref(false);
const createdUserResult = ref<(User & { initialPassword?: string }) | null>(null);

const isAssignModalOpen = ref(false);
const assignTargetUserId = ref("");
const assignTargetSiteIds = ref<string[]>([]);

const isConfirmDeleteOpen = ref(false);
const userToDelete = ref<User | null>(null);

const isConfirmResetOpen = ref(false);
const userToReset = ref<User | null>(null);
const isResetting = ref(false);

const deleteConfirmMessage = computed(() => {
  return (
    "ユーザー「" +
    (userToDelete.value?.lastName || "") +
    " " +
    (userToDelete.value?.firstName || "") +
    "」を削除してもよろしいですか？"
  );
});

const resetConfirmMessage = computed(() => {
  return (
    "ユーザー「" +
    (userToReset.value?.lastName || "") +
    " " +
    (userToReset.value?.firstName || "") +
    "」のパスワードを強制的に初期化し、新しい初期パスワードを発行しますか？"
  );
});

// --- イベントハンドラ ---
const handleUserCreated = (user: User) => {
  createdUserResult.value = user;
  isCredentialModalOpen.value = true;
};

const handleOpenAssign = (row: User) => {
  assignTargetUserId.value = row.id;
  assignTargetSiteIds.value = [...(row.assignedSiteIds || [])];
  isAssignModalOpen.value = true;
};

const confirmDelete = (row: User) => {
  if (row.id === "master") {
    alert("マスターユーザーは削除できません。");
    return;
  }
  userToDelete.value = row;
  isConfirmDeleteOpen.value = true;
};

const handleDeleteUser = async () => {
  if (userToDelete.value) {
    await deleteUser(userToDelete.value.id);
    isConfirmDeleteOpen.value = false;
    userToDelete.value = null;
  }
};

const confirmResetPassword = (row: User) => {
  userToReset.value = row;
  isConfirmResetOpen.value = true;
};

const handleResetPassword = async () => {
  if (!userToReset.value) return;
  isResetting.value = true;
  try {
    const newPassword = await resetUserPassword(userToReset.value.id);
    createdUserResult.value = {
      ...userToReset.value,
      initialPassword: newPassword,
    };
    isConfirmResetOpen.value = false;
    isCredentialModalOpen.value = true;
  } catch (e: unknown) {
    alert((e as Error).message);
  } finally {
    isResetting.value = false;
    userToReset.value = null;
  }
};
</script>

<template>
  <div class="c-admin-users">
    <AppPanel title="ユーザー一覧">
      <div class="c-admin-users__stack">
        <div class="c-admin-users__toolbar">
          <AppButton
            variant="primary"
            icon="plus"
            @click="isCreateModalOpen = true"
            >新規ユーザー登録</AppButton
          >
        </div>

        <AppTable 
        :columns="userHeaders" 
        :data="sortedUsers"
        :sort-by="sortKey"
        :sort-order="sortOrder"
        @sort="handleSort"
      >
          <template #cell-name="{ row }">
            {{ row.lastName }} {{ row.firstName }}
          </template>
          <template #cell-role="{ row }">
            <AppBadge
              :variant="
                row.role === 'admin'
                  ? 'danger'
                  : row.role === 'worker'
                    ? 'success'
                    : 'secondary'
              "
            >
              {{ row.role }}
            </AppBadge>
          </template>
          <template #cell-status="{ row }">
            <div class="c-admin-users__stack">
              <AppBadge
                v-if="row.requirePasswordReset"
                variant="danger"
                size="sm"
                >PWリセット要求</AppBadge
              >
              <span class="c-admin-users__meta"
                >最終ログイン: {{ formatLastLogin(row) }}</span
              >
            </div>
          </template>
          <template #cell-actions="{ row }">
            <div class="c-admin-users__actions">
              <AppButton
                variant="secondary"
                size="sm"
                @click="handleOpenAssign(row)"
                >現場アサイン</AppButton
              >
              <AppButton
                variant="secondary"
                size="sm"
                @click="confirmResetPassword(row)"
                >PW初期化</AppButton
              >
              <AppButton
                variant="danger"
                size="sm"
                :disabled="row.id === 'master'"
                @click="confirmDelete(row)"
                >削除</AppButton
              >
            </div>
          </template>
        </AppTable>
      </div>
    </AppPanel>

    <!-- モーダル群 (関心の分離) -->
    <PortalUserCreateModal
      v-model="isCreateModalOpen"
      @success="handleUserCreated"
    />

    <PortalUserCredentialModal
      v-model="isCredentialModalOpen"
      :user="createdUserResult"
    />

    <PortalUserAssignModal
      v-model="isAssignModalOpen"
      :user-id="assignTargetUserId"
      :initial-site-ids="assignTargetSiteIds"
    />

    <AppConfirmModal
      v-model="isConfirmDeleteOpen"
      title="ユーザー削除"
      :message="deleteConfirmMessage"
      confirm-text="削除する"
      intent="danger"
      @confirm="handleDeleteUser"
    />

    <AppConfirmModal
      v-model="isConfirmResetOpen"
      title="パスワード初期化"
      :message="resetConfirmMessage"
      confirm-text="初期化する"
      intent="danger"
      @confirm="handleResetPassword"
    />
  </div>
</template>

<style scoped lang="scss">
.c-admin-users {
  &__toolbar {
      display: flex;
      justify-content: flex-end;
    }
    
    &__stack {
    @include flex-column(var(--gap-section));
  }

  &__actions {
    @include flex-start(var(--gap-component));
  }

  &__meta {
    @extend %text-meta;
  }
}
</style>
