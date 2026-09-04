<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import type { Site } from '~/types/admin'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  site: Site | null
}>()

const emit = defineEmits<{
  (e: 'update:site', site: Site): void
  (e: 'close'): void
}>()

const { users, fetchUsers } = useAdminUsers()

const editData = ref<Partial<Site>>({})
const excludedCircuitsList = ref<string[]>([])

const addCircuit = () => {
  excludedCircuitsList.value.push('')
}
const removeCircuit = (idx: number) => {
  excludedCircuitsList.value.splice(idx, 1)
}

watch(
  () => props.site,
  (newSite) => {
    if (newSite) {
      editData.value = { ...newSite }
      excludedCircuitsList.value = [...(newSite.excludedCircuits || [])]
    }
    else {
      editData.value = {}
      excludedCircuitsList.value = []
    }
  },
  { immediate: true },
)

watch(isOpen, async (val) => {
  if (val && users.value.length === 0) {
    await fetchUsers()
  }
})

const statusOptions = [
  { label: '計画中', value: 'planning' },
  { label: '進行中', value: 'in_progress' },
  { label: '完了', value: 'completed' },
  { label: '保留', value: 'on_hold' },
]

const tabs = [
  { value: 'basic', label: '基本設定', icon: 'info' },
  { value: 'integration', label: '連携設定', icon: 'link' },
  { value: 'rules', label: 'ルール設定', icon: 'filter' },
]
const activeTab = ref('basic')

const editStatus = computed({
  get: () => (editData.value.status || '') as string,
  set: (val: string) =>
    (editData.value.status = val as typeof editData.value.status),
})
const editId = computed({
  get: () => (editData.value.id || '') as string,
  set: (val: string) => (editData.value.id = val),
})

// ワーカー名解決
const workerNames = computed(() => {
  if (!props.site?.id || !users.value) return []
  const assignedUsers = users.value.filter(
    u => u.assignedSiteIds && u.assignedSiteIds.includes(props.site!.id),
  )

  return assignedUsers.map(u => `${u.lastName} ${u.firstName}`)
})

const handleSave = async () => {
  if (!props.site) return
  const parsedCircuits = excludedCircuitsList.value
    .map(c => c.trim())
    .filter(c => c.length > 0)

  const payload: Site = {
    ...props.site,
    ...editData.value,
    excludedCircuits: parsedCircuits,
  }

  emit('update:site', payload)
  isOpen.value = false
}

const showSyncMsg = ref(false)
const syncMsg = ref('')
const handleImport = () => {
  syncMsg.value = 'Excelからデータの取込が完了しました（ダミー）'
  showSyncMsg.value = true
  setTimeout(() => (showSyncMsg.value = false), 3000)
}
const handleExport = () => {
  syncMsg.value = 'Excelへデータを書戻しました（ダミー）'
  showSyncMsg.value = true
  setTimeout(() => (showSyncMsg.value = false), 3000)
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="現場設定"
    icon="settings"
    @cancel="isOpen = false"
  >
    <div class="c-site-settings">
      <AppTabs v-model="activeTab" :options="tabs" />

      <div class="c-site-settings__content">
        <template v-if="activeTab === 'basic'">
          <AppFormGroup label="ステータス">
            <AppSelect v-model="editStatus" :options="statusOptions" />
          </AppFormGroup>
          <AppFormGroup label="現場ID (半角英数)">
            <AppInput v-model="editId" placeholder="例: site-tokyo-01" />
          </AppFormGroup>
          <AppFormGroup label="現場名">
            <AppInput v-model="editData.name" />
          </AppFormGroup>
          <AppFormGroup label="アサイン済ワーカー">
            <div class="c-site-settings__workers">
              <template v-if="workerNames.length > 0">
                <AppBadge
                  v-for="(name, idx) in workerNames"
                  :key="idx"
                  color="secondary"
                >
                  {{ name }}
                </AppBadge>
              </template>
              <div v-else class="u-text-muted u-text-sm">
                アサインされているワーカーはいません
              </div>
            </div>
          </AppFormGroup>
        </template>

        <template v-else-if="activeTab === 'integration'">
          <AppFormGroup label="Excel連携ファイル保存先 (絶対パス)">
            <AppInput
              v-model="editData.excelPath"
              placeholder="例: D:\Data\site_a.xlsm"
            />
          </AppFormGroup>
          <AppFormGroup label="帳票テンプレート保存先 (絶対パス)">
            <AppInput
              v-model="editData.reportTemplatePath"
              placeholder="例: D:\Templates\report.xlsx"
            />
          </AppFormGroup>

          <AppPanel title="データベース連携" class="u-mt-6">
            <div class="c-site-settings__sync-actions">
              <AppButton variant="danger" icon="download" @click="handleImport">
                Excelから取込 (初期化)
              </AppButton>
              <AppButton variant="primary" icon="upload" @click="handleExport">
                Excelへ書戻し
              </AppButton>
            </div>
            <div v-if="showSyncMsg" class="c-site-settings__sync-msg">
              {{ syncMsg }}
            </div>
          </AppPanel>
        </template>

        <template v-else-if="activeTab === 'rules'">
          <AppFormGroup label="除外回路の設定">
            <template #description>
              計算や連携の対象外とする回路を複数追加できます。
            </template>
            <div class="c-site-settings__circuit-list">
              <div
                v-for="(_, idx) in excludedCircuitsList"
                :key="idx"
                class="c-site-settings__circuit-row"
              >
                <AppInput
                  v-model="excludedCircuitsList[idx]"
                  placeholder="例: 盤A-回路1"
                />
                <AppButton
                  variant="danger"
                  icon="trash-2"
                  size="sm"
                  @click="removeCircuit(idx)"
                />
              </div>
              <AppButton
                variant="secondary"
                icon="plus"
                size="sm"
                @click="addCircuit"
              >
                除外回路を追加する
              </AppButton>
            </div>
          </AppFormGroup>
        </template>
      </div>
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="isOpen = false">
        キャンセル
      </AppButton>
      <AppButton variant="primary" @click="handleSave"> 保存する </AppButton>
    </template>
  </AppModal>
</template>

<style lang="scss" scoped>
.c-site-settings {
  @include flex-start-stretch($direction: column);

  gap: var(--space-card-gap);

  &__content {
    @include flex-start-stretch($direction: column);

    gap: var(--space-form-row-gap);
    min-height: 300px;
  }

  &__workers {
    @include flex-start-center;

    flex-wrap: wrap;
    gap: var(--space-2);
    min-height: 40px;
    padding: var(--space-2);

    @include border-base($opacity: 30%);
  }

  &__sync-actions {
    @include flex-start-center;

    gap: var(--space-2);
  }

  &__sync-msg {
    @include text-meta;

    padding: var(--space-1) var(--space-2);
    color: var(--color-status-success);
  }

  &__circuit-list {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
  }

  &__circuit-row {
    @include flex-start-center;

    gap: var(--space-1);

    > *:first-child {
      flex: 1;
    }
  }
}
</style>
