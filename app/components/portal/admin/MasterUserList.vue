<script setup lang="ts">
/**
 * MasterUserList
 * [Portal Organisms] ユーザー管理の左ペイン（Master）。
 * ユーザー一覧、検索フィルター、新規ユーザー作成トリガーを一元提供します。
 */
import { computed, ref } from 'vue'

import type { User } from '#shared/types/auth'

const props = defineProps<{
  users: User[]
  selectedUserId: string | null
}>()

const emit = defineEmits<{
  select: [user: User]
  create: []
}>()

const searchQuery = ref('')

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return props.users
  }

  return props.users.filter((u) => {
    const searchTarget = `${u.lastName || ''}${u.firstName || ''} ${u.lastNameKana || ''}${u.firstNameKana || ''} ${u.loginId || u.id || ''}`.toLowerCase()

    return searchTarget.includes(query)
  })
})
</script>

<template>
  <div class="flex flex-col gap-3 w-full">

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

    <Input
      v-model="searchQuery"
      placeholder="氏名・カナ・IDで検索..."
    />

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
