<script setup lang="ts">
/**
 * DetailSiteSettings
 * [Portal Organisms] 現場管理の右ペイン（詳細設定コンソール）
 * 選択された現場の基本情報、Excelデータ連携、除外回路ルールを統合提供します。
 */
import { computed, reactive, ref, watch } from 'vue'

import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import { SITE_SETTINGS_TABS, SITE_STATUS_OPTIONS } from '~/constants/adminConstants'
import type { Site } from '~/types/admin'
import { getAssignedWorkerNames } from '~/utils/portal'

const props = defineProps<{
  site: Site | null
  isSaving?: boolean
  isDeleting?: boolean
}>()

const emit = defineEmits<{
  save: [payload: Site]
  delete: [site: Site]
}>()

const activeTab = ref('basic')
const { users, fetchUsers } = useAdminUsers()

// 単一のリアクティブオブジェクトに集約（断片化と余計なcomputedラッパーを全廃）
const form = reactive({
  name: '',
  status: 'planning' as Site['status'],
  excludedCircuits: [] as string[],
})

watch(
  () => props.site,
  async (newSite) => {
    if (newSite) {
      form.name = newSite.name || ''
      form.status = newSite.status || 'planning'
      form.excludedCircuits = [...(newSite.excludedCircuits || [])]

      if (users.value.length === 0) {
        await fetchUsers()
      }
    }
  },
  { immediate: true },
)

const workerNames = computed(() =>
  getAssignedWorkerNames(props.site?.id, users.value),
)

const handleSave = () => {
  if (!props.site) return

  const parsedCircuits = form.excludedCircuits
    .map(c => c.trim())
    .filter(c => c.length > 0)

  emit('save', {
    ...props.site,
    name: form.name.trim(),
    status: form.status,
    excludedCircuits: parsedCircuits,
  })
}
</script>

<template>
  <div class="flex flex-col gap-6 w-full">

    <EmptyState
      v-if="!site"
      icon="layout"
      title="現場が選択されていません"
      description="左側の現場一覧から、設定やデータ連携を行う現場を選択してください。"
      class="placeholder-empty min-h-[400px] flex items-center justify-center"
    />

    <template v-else>

      <SectionHeader icon="settings">
        <template #default>
          <div class="flex items-baseline gap-2">
            <span>{{ site.name }}</span>
            <span class="site-id">
              (ID: {{ site.id }})
            </span>
          </div>
        </template>

        <template #actions>
          <div class="flex items-center gap-2">
            <Button
              variant="danger"
              icon="trash-2"
              :loading="isDeleting"
              @click="emit('delete', site)"
            >
              削除
            </Button>
            <Button
              variant="success"
              icon="save"
              :loading="isSaving"
              @click="handleSave"
            >
              変更を保存
            </Button>
          </div>
        </template>
      </SectionHeader>

      <Tabs
        v-model="activeTab"
        :options="SITE_SETTINGS_TABS"
      >

        <template #basic>
          <div class="flex flex-col gap-5 max-w-xl">
            <SectionHeader
              title="現場基本情報"
              icon="info"
              tag="h4"
            />

            <FormGroup label="現場ID (変更不可)">
              <Input
                :model-value="site.id"
                disabled
              />
            </FormGroup>

            <FormGroup label="現場名">
              <Input
                v-model="form.name"
                placeholder="例: 新宿プロジェクト"
              />
            </FormGroup>

            <FormGroup label="ステータス">
              <Select
                v-model="form.status"
                :options="SITE_STATUS_OPTIONS"
              />
            </FormGroup>

            <FormGroup label="アサイン済作業者">
              <div
                v-if="workerNames.length > 0"
                class="flex flex-wrap items-center gap-2"
              >
                <Badge
                  v-for="worker in workerNames"
                  :key="worker"
                >
                  {{ worker }}
                </Badge>
              </div>
              <EmptyState
                v-else
                icon="users"
                title="アサインされている作業者はいません"
                description="ユーザー管理画面から作業者をアサインしてください。"
              />
            </FormGroup>
          </div>
        </template>

        <template #integration>
          <PortalTabSiteExcelIntegration :site="site" />
        </template>

        <template #rules>
          <PortalTabSiteExcludedRules v-model="form.excludedCircuits" />
        </template>
      </Tabs>
    </template>
  </div>
</template>

<style scoped>
.site-id {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
