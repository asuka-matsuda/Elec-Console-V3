<script setup lang="ts">
/**
 * TabWordBreak
 * [Master Organisms] 改行禁止ワード管理タブ。
 * システム全体の改行禁止ワードの追加・一覧・編集・削除を行います。
 */
import { useMasterCrud } from '~/composables/master/useMasterCrud'
import { useNoBreakWords } from '~/composables/useNoBreakWords'
import type { TableColumn, WordBreakItem } from '~/types/components'
import { getTodayDateInput } from '~/utils/date'

interface WordBreakForm {
  word: string
  date: string
}

const { fetchWords } = useNoBreakWords()

const {
  items: wordBreakList,
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
} = await useMasterCrud<WordBreakItem, WordBreakForm>({
  endpoint: '/api/master/word-break',
  initialForm: { word: '', date: '' },
  validationRules: { date: '追加日', word: '単語' },
  mapItemToForm: item => ({ word: item.word, date: item.date.replace(/\./g, '-') }),
  mapFormToPayload: form => ({ ...form, date: form.date.replace(/-/g, '.') }),
  getNewFormDefaults: () => ({ date: getTodayDateInput() }),
  deleteConfirm: {
    title: '改行禁止ワードの削除',
    message: item => `「${item.word}」を改行禁止ワードから削除してもよろしいですか？`,
  },
  onAfterSave: () => fetchWords(true),
  onAfterDelete: () => fetchWords(true),
})

const columns: TableColumn<WordBreakItem>[] = [
  { key: 'date', label: '追加日', width: '130px' },
  { key: 'word', label: '単語' },
  { key: 'actions', label: '操作', width: '120px', align: 'right' },
]
</script>

<template>
  <MasterCrudLayout
    v-model:is-modal-open="isEditModalOpen"
    description="テーブルの盤名称等で途中で改行させない単語を管理します（※「1-1」「分電盤」等はシステムで自動処理されます）。"
    create-button-text="新規ワード追加"
    :columns="columns"
    :data="wordBreakList"
    :loading="pending"
    empty-text="登録されている改行禁止ワードはありません。"
    :modal-title="editingId ? '単語の編集' : '新規ワード登録'"
    modal-icon="type"
    :is-saving="isSaving"
    :form-error="formError"
    @create="openModal()"
    @edit="openModal($event)"
    @delete="handleDelete($event)"
    @save="handleSave"
  >
    <FormGroup
      label="追加日"
      required
      :error="fieldErrors.date"
    >
      <Input
        v-model="form.date"
        type="date"
      />
    </FormGroup>

    <FormGroup
      label="単語"
      required
      :error="fieldErrors.word"
    >
      <Input
        v-model="form.word"
        placeholder="例: 自動倉庫, 受変電設備"
      />
    </FormGroup>
  </MasterCrudLayout>
</template>
