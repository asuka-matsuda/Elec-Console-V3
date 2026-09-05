<script setup lang="ts">
import { toRef } from 'vue'

import { useSiteSettingsForm } from '~/composables/portal/useSiteSettingsForm'
import type { Site } from '~/types/admin'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  site: Site | null
}>()

const emit = defineEmits<{
  (e: 'update:site', site: Site): void
  (e: 'close'): void
}>()

const {
  editData,
  editStatus,
  editId,
  excludedCircuitsList,
  addCircuit,
  removeCircuit,
  activeTab,
  tabs,
  statusOptions,
  workerNames,
  handleSave,
  showSyncMsg,
  syncMsg,
  handleImport,
  handleExport,
} = useSiteSettingsForm({
  site: toRef(props, 'site'),
  isOpen,
  onSave: payload => emit('update:site', payload),
})
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="現場設定"
    icon="settings"
    @cancel="isOpen = false"
  >
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
