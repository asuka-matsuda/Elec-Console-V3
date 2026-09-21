<script setup lang="ts">
/**
 * UserSiteAssignment
 * [Portal Molecules] ユーザー管理の現場アサイン設定セクション。
 * 登録済み現場一覧からユーザーが参加可能な現場のチェックボックス選択を提供します。
 */
import type { Site } from '~/types/admin'

const model = defineModel<string[]>({ default: () => [] })

defineProps<{
  siteList: Site[]
}>()
</script>

<template>
  <div class="flex flex-col gap-4 max-w-xl">
    <SectionHeader
      title="参加現場アサイン"
      icon="building"
      tag="h4"
    />

    <p class="desc-text m-0">
      このユーザーが参加・閲覧できる現場を選択してください。
    </p>

    <div v-if="siteList.length > 0" class="flex flex-col gap-2">
      <Checkbox
        v-for="site in siteList"
        :key="site.id"
        v-model="model"
        :value="site.id"
        :label="`${site.name} (${site.id})`"
      />
    </div>

    <EmptyState
      v-else
      icon="inbox"
      title="登録された現場がありません"
      description="現場管理タブから現場を作成してください。"
    />
  </div>
</template>

<style scoped>
.desc-text {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
}
</style>
