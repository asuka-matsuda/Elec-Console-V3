<script setup lang="ts">
/**
 * PanelUserProfile
 * [Portal Molecules] ユーザーのアカウント基本情報（氏名・カナ・ログインID）を表示するパネルコンポーネント。
 */
import { computed } from 'vue'

import type { User } from '#shared/types/auth'

const { user } = defineProps<{
  user: User
}>()

const fullName = computed(() => `${user.lastName || ''} ${user.firstName || ''}`.trim() || '（未設定）')
const kana = computed(() => `${user.lastNameKana || ''} ${user.firstNameKana || ''}`.trim())
</script>

<template>
  <dl class="grid grid-cols-1 sm:grid-cols-2 gap-panel-gap m-0">
    <div class="flex flex-col gap-inline-gap">
      <dt class="label">氏名</dt>
      <dd class="m-0 flex flex-col">
        <span class="name">{{ fullName }}</span>
        <span v-if="kana" class="kana">
          {{ kana }}
        </span>
      </dd>
    </div>

    <div class="flex flex-col gap-inline-gap">
      <dt class="label">ログインID</dt>
      <dd class="m-0 login-id">
        {{ user.loginId || user.id }}
      </dd>
    </div>
  </dl>
</template>

<style scoped lang="scss">
.label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
}

.name {
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}

.kana {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.login-id {
  font-family: var(--font-mono);
  color: var(--color-text-main);
}
</style>
