<script setup lang="ts">
/**
 * PortalTablePhase1
 * [Portal Organisms] フェーズ1（回路確認・増締）の回路一覧テーブルコンポーネント。
 * 回路情報のインライン編集（番号・名称・配線・備考）、ワンタップ確定および解除操作を管理します。
 */
import { reactive, ref, toRef } from 'vue'

import { useTableSort } from '~/composables/useTableSort'
import { PHASE1_TABLE_COLUMNS } from '~/constants/soudenConstants'
import type { CircuitItem } from '~/types/souden'

const props = defineProps<{
  circuits: CircuitItem[]
  fullCircuits?: CircuitItem[]
  isCircuitLocked: (circuit: CircuitItem) => boolean
  isActionLoading: Record<string, boolean>
}>()

const emit = defineEmits<{
  'confirm': [circuit: CircuitItem]
  'clear': [circuit: CircuitItem]
  'save-edit': [circuit: CircuitItem, form: Record<string, string>]
}>()

// 各行の編集状態（テーブル内UI状態）
const editingRowId = ref<string | null>(null)
const editForm = reactive<Record<string, string>>({
  kairoBangou: '',
  kairoMeisho: '',
  cableList: '',
  haisenJousuu: '',
  setsuchiList: '',
  remarks: '',
})

const startEdit = (circuit: CircuitItem) => {
  editingRowId.value = circuit.id
  editForm.kairoBangou = circuit.kairoBangou || ''
  editForm.kairoMeisho = circuit.kairoMeisho || ''
  editForm.cableList = circuit.cableList || ''
  editForm.haisenJousuu = circuit.haisenJousuu || ''
  editForm.setsuchiList = circuit.setsuchiList || ''
  editForm.remarks = circuit.p1Remarks || ''
}

const cancelEdit = () => {
  editingRowId.value = null
}

const saveEdit = (circuit: CircuitItem) => {
  emit('save-edit', circuit, { ...editForm })
  editingRowId.value = null
}

const isComplete = (c: CircuitItem) => Boolean(c.p1ConfirmedAt)

// ソート管理
const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
  handleSort,
} = useTableSort(toRef(props, 'circuits'))
</script>

<template>
  <PortalTableSoudenCircuit
    class="flex-1 min-h-[400px]"
    :columns="PHASE1_TABLE_COLUMNS"
    :circuits="sortedCircuits"
    :full-circuits="fullCircuits || circuits"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    :is-circuit-locked="isCircuitLocked"
    :is-complete="isComplete"
    :editing-row-id="editingRowId"
    @sort="handleSort"
  >

    <template #cell-kairoBangou="{ row: circuit }">
      <Input
        v-if="editingRowId === circuit.id"
        v-model="editForm.kairoBangou"
        placeholder="番号"
      />
      <div v-else class="flex items-center justify-center">
        <PortalCircuitSymbol
          :kigou="circuit.kairoKigou"
          :bangou="circuit.kairoBangou"
        />
      </div>
    </template>

    <template #cell-kairoMeisho="{ row: circuit }">
      <Textarea
        v-if="editingRowId === circuit.id"
        v-model="editForm.kairoMeisho"
        :rows="2"
        placeholder="回路名称"
      />
      <span
        v-else
        class="circuit-meisho"
        :title="circuit.kairoMeisho || ''"
      >
        {{ circuit.kairoMeisho || '-' }}
      </span>
    </template>

    <template #cell-cableList="{ row: circuit }">
      <div v-if="editingRowId === circuit.id" class="flex flex-col gap-1">
        <div class="flex items-center gap-1">
          <Input v-model="editForm.cableList" placeholder="ケーブル" />
          <Input v-model="editForm.haisenJousuu" placeholder="条数" class="w-14" />
        </div>
        <Input v-model="editForm.setsuchiList" placeholder="接地リスト" />
      </div>
      <div v-else class="flex flex-col gap-0.5">
        <div class="flex items-center gap-1">
          <span class="cell-cable">{{ circuit.cableList || '-' }}</span>
          <span v-if="circuit.haisenJousuu" class="cell-jousuu">({{ circuit.haisenJousuu }})</span>
        </div>
        <span class="cell-setsuchi" :title="circuit.setsuchiList || ''">
          {{ circuit.setsuchiList ? `E: ${circuit.setsuchiList}` : '-' }}
        </span>
      </div>
    </template>

    <template #cell-p1Kakunin="{ row: circuit }">
      <div class="flex items-center justify-center">
        <Badge :id="isComplete(circuit) ? 'exam:pass' : undefined">
          {{ isComplete(circuit) ? '確認・増締済' : '未実施' }}
        </Badge>
      </div>
    </template>

    <template #cell-p1Remarks="{ row: circuit }">
      <Textarea
        v-if="editingRowId === circuit.id"
        v-model="editForm.remarks"
        :rows="2"
        placeholder="備考"
      />
      <span v-else class="cell-remarks" :title="circuit.p1Remarks || ''">
        {{ circuit.p1Remarks || '-' }}
      </span>
    </template>

    <template #cell-actions="{ row: circuit }">
      <PortalCellSoudenActions
        :circuit="circuit"
        :is-locked="isCircuitLocked(circuit)"
        locked-reason="幹線未完了"
        :is-editing="editingRowId === circuit.id"
        :is-completed="isComplete(circuit)"
        :is-loading="isActionLoading[circuit.id]"
        :has-modify-button="false"
        confirm-label="確定"
        edit-label="編集"
        save-label="保存"
        @confirm="$emit('confirm', circuit)"
        @clear="$emit('clear', circuit)"
        @edit="startEdit(circuit)"
        @save="saveEdit(circuit)"
        @cancel="cancelEdit"
      />
    </template>
  </PortalTableSoudenCircuit>
</template>

<style scoped lang="scss">
.cell-cable {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-main);
}

.cell-jousuu {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.cell-setsuchi {
  overflow: hidden;

  max-width: 140px;

  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
