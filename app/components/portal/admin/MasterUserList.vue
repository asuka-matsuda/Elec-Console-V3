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
  <div class="flex flex-col gap-panel-gap w-full flex-1 min-h-0">

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

    <ul class="flex flex-col gap-item-gap overflow-y-auto flex-1 min-h-[300px] list-none m-0 p-0">
      <Panel
        v-for="user in filteredUsers"
        :key="user.id"
        as="li"
        interactive
        padding="compact"
        :active="user.id === selectedUserId"
        class="w-full flex flex-col gap-inline-gap"
        @click="emit('select', user)"
      >
        <div class="flex items-center gap-item-gap min-w-0">
          <span>
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
    </ul>
  </div>
</template>
