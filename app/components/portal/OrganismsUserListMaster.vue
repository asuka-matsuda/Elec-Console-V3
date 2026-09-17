<script setup lang="ts">
/**
 * OrganismsUserListMaster
 * [Portal Organisms] ユーザー管理の左ペイン（Master）。
 * ユーザー一覧、検索フィルター、権限絞り込み、新規ユーザー作成トリガーを一元提供します。
 */
import { computed, ref } from 'vue'

import type { User, UserRole } from '~/types/auth'
import type { RadioOption } from '~/types/components'

const props = defineProps<{
  users: User[]
  selectedUserId: string | null
}>()

const emit = defineEmits<{
  select: [user: User]
  create: []
}>()

const searchQuery = ref('')
const roleFilter = ref<string>('all')

const filterOptions: RadioOption<string>[] = [
  { label: 'すべて', value: 'all' },
  { label: '管理者', value: 'admin' },
  { label: '作業者', value: 'worker' },
]

const filteredUsers = computed(() => {
  return props.users.filter((u) => {
    // 権限絞り込み
    if (roleFilter.value !== 'all' && u.role !== (roleFilter.value as UserRole)) {
      return false
    }

    // 検索語句絞り込み（氏名、カナ、ログインID）
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const fullName = `${u.lastName || ''} ${u.firstName || ''}`.toLowerCase()
      const fullNameKana = `${u.lastNameKana || ''} ${u.firstNameKana || ''}`.toLowerCase()
      const loginId = (u.loginId || u.id || '').toLowerCase()

      const matchName = fullName.includes(q)
      const matchKana = fullNameKana.includes(q)
      const matchId = loginId.includes(q)

      if (!matchName && !matchKana && !matchId) return false
    }

    return true
  })
})
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <!-- ヘッダー: タイトル & 新規登録ボタン (MoleculesSectionHeader) -->
    <MoleculesSectionHeader
      title="ユーザー一覧"
      icon="users"
      size="sm"
    >
      <template #actions>
        <Button
          icon="plus"
          @click="emit('create')"
        >
          新規登録
        </Button>
      </template>
    </MoleculesSectionHeader>

    <!-- 検索バー -->
    <AtomsInput
      v-model="searchQuery"
      placeholder="氏名・カナ・IDで検索..."
    />

    <!-- 権限フィルター (AtomsRadioGroup) -->
    <div class="overflow-x-auto pb-1">
      <AtomsRadioGroup
        v-model="roleFilter"
        :options="filterOptions"
      />
    </div>

    <!-- ユーザー一覧リスト -->
    <div class="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[300px]">
      <template v-if="filteredUsers.length > 0">
        <PortalMoleculesUserListItem
          v-for="user in filteredUsers"
          :key="user.id"
          :user="user"
          :is-selected="user.id === selectedUserId"
          @select="emit('select', $event)"
        />
      </template>

      <MoleculesEmptyState
        v-else
        icon="search"
        title="該当するユーザーがいません"
        description="検索条件を変更するか、新規ユーザーを登録してください。"
      />
    </div>
  </div>
</template>
