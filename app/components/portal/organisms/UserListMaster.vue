<script setup lang="ts">
/**
 * UserListMaster
 * [Portal Organisms] ユーザー管理の左ペイン（Master）。
 * ユーザー一覧、検索フィルター、権限絞り込み、新規ユーザー作成トリガーを一元提供します。
 */
import { computed, ref } from 'vue'

import type { User, UserRole } from '~/types/auth'
import type { RadioOption } from '~/types/components'

type RoleFilterType = 'all' | UserRole

const props = defineProps<{
  users: User[]
  selectedUserId: string | null
}>()

const emit = defineEmits<{
  select: [user: User]
  create: []
}>()

const searchQuery = ref('')
const roleFilter = ref<RoleFilterType>('all')

const filterOptions: RadioOption<RoleFilterType>[] = [
  { label: 'すべて', value: 'all' },
  { label: '管理者', value: 'admin' },
  { label: '作業者', value: 'worker' },
  { label: '閲覧者', value: 'viewer' },
]

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const role = roleFilter.value

  if (role === 'all' && !query) {
    return props.users
  }

  return props.users.filter((u) => {
    // 1. 権限絞り込み
    if (role !== 'all' && u.role !== role) {
      return false
    }

    // 2. 検索語句絞り込み（氏名・カナ・ログインID）
    if (query) {
      const searchTarget = `${u.lastName || ''}${u.firstName || ''} ${u.lastNameKana || ''}${u.firstNameKana || ''} ${u.loginId || u.id || ''}`.toLowerCase()

      if (!searchTarget.includes(query)) return false
    }

    return true
  })
})
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <!-- ヘッダー: タイトル & 新規登録ボタン -->
    <SectionHeader
      title="ユーザー一覧"
      icon="users"
      tag="h3"
    >
      <template #actions>
        <Button
          icon="plus"
          @click="emit('create')"
        >
          新規登録
        </Button>
      </template>
    </SectionHeader>

    <!-- 検索バー -->
    <Input
      v-model="searchQuery"
      placeholder="氏名・カナ・IDで検索..."
    />

    <!-- 権限フィルター (block指定で均等配置、不要なラッパーdivを排除) -->
    <RadioGroup
      v-model="roleFilter"
      :options="filterOptions"
      block
    />

    <!-- ユーザー一覧リスト (不要な template v-if ラッパーを排除) -->
    <div class="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[300px]">
      <Panel
        v-for="user in filteredUsers"
        :key="user.id"
        interactive
        :selected="user.id === selectedUserId"
        class="p-3 w-full"
        @click="emit('select', user)"
      >
        <div class="flex items-center gap-2 min-w-0 mb-1">
          <span class="user-name">
            {{ user.lastName }} {{ user.firstName }}
          </span>
          <Badge :id="`role:${user.role}`" class="shrink-0" />
          <Badge v-if="user.requirePasswordReset" id="user:pwd-reset" class="shrink-0" />
        </div>

        <div>
          ID: {{ user.loginId || user.id }}
        </div>
      </Panel>

      <EmptyState
        v-if="filteredUsers.length === 0"
        icon="search"
        title="該当するユーザーがいません"
        description="検索条件を変更するか、新規ユーザーを登録してください。"
      />
    </div>
  </div>
</template>

<style scoped>
.user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
