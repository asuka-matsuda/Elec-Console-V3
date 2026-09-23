<script setup lang="ts">
/**
 * TabHistory
 * [Master Organisms] 更新履歴管理タブ。
 * システム全体の更新履歴の追加・一覧・編集・削除を行います。
 */
import { useMasterCrud } from '~/composables/master/useMasterCrud'
import type { HistoryItem, TableColumn } from '~/types/components'
import { getTodayDateInput } from '~/utils/date'

interface HistoryForm {
  version: string
  title: string
  date: string
  desc: string
}

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
  initialForm: { version: 'v', title: '', date: '', desc: '' },
  validationRules: { version: 'バージョン', date: '日付', title: 'タイトル' },
  mapItemToForm: item => ({
    version: item.version,
    title: item.title,
    date: item.date.replace(/\./g, '-'),
    desc: item.desc || '',
  }),
  mapFormToPayload: form => ({
    ...form,
    date: form.date.replace(/-/g, '.'),
  }),
  getNewFormDefaults: () => ({ date: getTodayDateInput() }),
  deleteConfirm: {
    title: '更新履歴の削除',
    message: () => 'この更新履歴を削除してもよろしいですか？',
  },
})

const columns: TableColumn<HistoryItem>[] = [
  { key: 'version', label: 'バージョン', width: '110px' },
  { key: 'date', label: '日付', width: '130px' },
  { key: 'title', label: 'タイトル' },
  { key: 'desc', label: '内容詳細', truncate: true },
  { key: 'actions', label: '操作', width: '120px', align: 'right' },
]
</script>

<template>
  <MasterCrudLayout
    v-model:is-modal-open="isEditModalOpen"
    description="ダッシュボードの「更新履歴」ウィジェットに掲載されるバージョン情報を管理します。"
    create-button-text="新規更新履歴作成"
    :columns="columns"
    :data="historyList"
    :loading="pending"
    empty-text="登録されている更新履歴はありません。"
    :modal-title="editingId ? '編集' : '新規作成'"
    modal-icon="clock"
    :is-saving="isSaving"
    :form-error="formError"
    @create="openModal()"
    @edit="openModal($event)"
    @delete="handleDelete($event)"
    @save="handleSave"
  >
    <template #cell-version="{ row }">
      <Badge id="version:muted">
        {{ row.version }}
      </Badge>
    </template>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormGroup
        label="バージョン"
        required
        :error="fieldErrors.version"
      >
        <Input
          v-model="form.version"
          placeholder="例: v2.1.0"
        />
      </FormGroup>

      <FormGroup
        label="日付"
        required
        :error="fieldErrors.date"
      >
        <Input
          v-model="form.date"
          type="date"
        />
      </FormGroup>
    </div>

    <FormGroup
      label="タイトル"
      required
      :error="fieldErrors.title"
    >
      <Input
        v-model="form.title"
        placeholder="例: 新機能追加"
      />
    </FormGroup>

    <FormGroup label="詳細本文">
      <Textarea
        v-model="form.desc"
        :rows="5"
        placeholder="詳細な更新内容や変更点を入力してください（モーダルで表示されます）"
      />
    </FormGroup>
  </MasterCrudLayout>
</template>
