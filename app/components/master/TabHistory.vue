<script setup lang="ts">
/**
 * TabHistory
 * [Master Organisms] 更新履歴管理タブ。
 * システム全体の更新履歴の追加・一覧・編集・削除を行います。
 */
import type { HistoryItem } from '#shared/types/master'
import { useMasterCrud } from '~/composables/master/useMasterCrud'
import { getAllMenuItems, getMenuItemMap } from '~/constants/data/menuData'
import type { SelectOption, TableColumn } from '~/types/components'
import { formatDate, formatToDateInputString, getTodayDateInput } from '~/utils/date'

interface HistoryForm {
  version: string
  title: string
  date: string
  desc: string
  toolId: string
}

const toolMap = getMenuItemMap()
const menuItems = getAllMenuItems()

const toolOptions: SelectOption<string>[] = [
  { label: 'システム全体', value: 'system' },
  ...menuItems
    .filter(item => item.id && item.id !== 'home')
    .map(item => ({
      label: item.text,
      value: item.id!,
    })),
]

const {
  items: historyList,
  pending,
  isEditModalOpen,
  isSaving,
  editingId,
  formError,
  form,
  fieldErrors,
  openModal,
  handleSave,
  handleDelete,
} = await useMasterCrud<HistoryItem, HistoryForm>({
  endpoint: '/api/master/history',
  initialForm: { version: 'v', title: '', date: '', desc: '', toolId: 'system' },
  validationRules: { version: 'バージョン', date: '日付', title: 'タイトル' },
  mapItemToForm: item => ({
    version: item.version,
    title: item.title,
    date: formatToDateInputString(item.date),
    desc: item.desc || '',
    toolId: item.toolId || 'system',
  }),
  mapFormToPayload: form => ({
    ...form,
    toolId: form.toolId === 'system' ? null : form.toolId,
  }),
  getNewFormDefaults: () => ({ date: getTodayDateInput(), toolId: 'system' }),
  deleteConfirm: {
    title: '更新履歴の削除',
    message: () => 'この更新履歴を削除してもよろしいですか？',
  },
})

const columns: TableColumn<HistoryItem>[] = [
  { key: 'version', label: 'バージョン', width: '110px' },
  { key: 'toolId', label: '対象', width: '160px' },
  { key: 'date', label: '日付', width: '130px', format: val => formatDate(val) },
  { key: 'title', label: 'タイトル' },
  { key: 'desc', label: '内容詳細', truncate: true },
  { key: 'actions', label: '操作', width: '120px', align: 'right' },
]
</script>

<template>
  <section class="flex flex-col gap-panel-gap">
    <header class="flex flex-wrap items-center justify-between gap-panel-gap">
      <small>ダッシュボードの「更新履歴」ウィジェットに掲載されるバージョン情報を管理します。</small>

      <Button variant="primary" size="sm" icon="plus" @click="openModal()">更新履歴を作成する</Button>
    </header>

    <Table :columns="columns" :data="historyList" :loading="pending" empty-text="登録されている更新履歴はありません。">
      <template #cell-version="{ row }">
        <small class="version-text">{{ row.version }}</small>
      </template>

      <template #cell-toolId="{ row }">
        <span class="tool-name">{{ (row.toolId && toolMap.get(row.toolId)?.text) || 'システム全体' }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center justify-end">
          <Menu :items="[{ label: '履歴を編集…', icon: 'edit', action: () => openModal(row) }, { label: '履歴を削除', icon: 'trash-2', variant: 'danger', divider: true, action: () => handleDelete(row) }]" />
        </div>
      </template>
    </Table>

    <Modal v-model="isEditModalOpen" :title="editingId ? '編集' : '新規作成'" icon="clock">
      <template #actions>
        <Button :disabled="isSaving" @click="isEditModalOpen = false">キャンセル</Button>
        <Button variant="primary" :loading="isSaving" @click="handleSave">保存する</Button>
      </template>

      <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleSave">
        <Note v-if="formError" variant="error">{{ formError }}</Note>

        <div class="flex flex-col gap-inline-gap">
          <label for="history-tool" class="label">対象機能・ツール</label>
          <Select id="history-tool" v-model="form.toolId" :options="toolOptions" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-form-row-gap">
          <div class="flex flex-col gap-inline-gap">
            <label for="history-version" class="label">バージョン <span class="req-mark">＊</span></label>
            <Input id="history-version" v-model="form.version" placeholder="例: v1.0.0" />
            <p v-if="fieldErrors.version" class="error-text">
              {{ fieldErrors.version }}
            </p>
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="history-date" class="label">日付 <span class="req-mark">＊</span></label>
            <Input id="history-date" v-model="form.date" type="date" />
            <p v-if="fieldErrors.date" class="error-text">
              {{ fieldErrors.date }}
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="history-title" class="label">タイトル <span class="req-mark">＊</span></label>
          <Input id="history-title" v-model="form.title" placeholder="例: 新機能追加" />
          <p v-if="fieldErrors.title" class="error-text">
            {{ fieldErrors.title }}
          </p>
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="history-desc" class="label">詳細本文</label>
          <Textarea id="history-desc" v-model="form.desc" :rows="5" trim placeholder="例: フェーズ1の判定ロジックを最適化しました。" />
        </div>
      </form>
    </Modal>
  </section>
</template>

<style scoped lang="scss">
.tool-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.version-text {
  font-family: var(--font-mono);
  color: var(--color-text-muted);
}

.error-text {
  font-size: var(--font-size-xs);
  color: var(--color-status-danger);
}
</style>
