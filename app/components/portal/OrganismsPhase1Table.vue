<script setup lang="ts">
/**
 * PortalOrganismsPhase1Table
 * フェーズ1（回路確認・増し締め）の回路一覧テーブルOrganismコンポーネント。
 * 回路確認・増締めチェック、インライン編集（回路番号・名称・配線・備考）、確定および解除操作を管理します。
 */
import { computed, reactive, ref } from 'vue'

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

// 各行の編集状態
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

const isComplete = (c: CircuitItem) => Boolean(c.p1ConfirmedAt && c.p1Kakunin && c.p1Mashishime)

// ソート管理
const circuitsRef = computed(() => props.circuits)
const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
  handleSort,
} = useTableSort(circuitsRef)
</script>

<template>
  <PortalOrganismsSoudenCircuitTable
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
    <!-- 回路番号 -->
    <template #cell-kairoBangou="{ row: circuit }">
      <template v-if="editingRowId === circuit.id">
        <AtomsInput v-model="editForm.kairoBangou" placeholder="番号" />
      </template>
      <div v-else class="flex items-center justify-center">
        <PortalAtomsKairoSymbol
          :kigou="circuit.kairoKigou"
          :bangou="circuit.kairoBangou"
        />
      </div>
    </template>

    <!-- 回路名称 -->
    <template #cell-kairoMeisho="{ row: circuit }">
      <template v-if="editingRowId === circuit.id">
        <AtomsInput
          v-model="editForm.kairoMeisho"
          type="textarea"
          :rows="2"
          placeholder="回路名称"
        />
      </template>
      <span v-else class="cell-text cell-meisho" :title="circuit.kairoMeisho || ''">
        {{ circuit.kairoMeisho || '-' }}
      </span>
    </template>

    <!-- 配線 / 接地 -->
    <template #cell-cableList="{ row: circuit }">
      <template v-if="editingRowId === circuit.id">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-1">
            <AtomsInput v-model="editForm.cableList" placeholder="ケーブル" />
            <AtomsInput v-model="editForm.haisenJousuu" placeholder="条数" class="w-14" />
          </div>
          <AtomsInput v-model="editForm.setsuchiList" placeholder="接地リスト" />
        </div>
      </template>
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

    <!-- 確認 / 増締め (チェックボックス) -->
    <template #cell-p1Kakunin="{ row: circuit }">
      <div class="flex items-center justify-center gap-3">
        <label class="check-item inline-flex flex-col items-center gap-0.5" title="回路確認">
          <AtomsCheckbox
            v-model="circuit.p1Kakunin"
            :disabled="isComplete(circuit) || editingRowId === circuit.id || circuit.isExcluded || isCircuitLocked(circuit)"
          />
          <span class="check-item-label">確認</span>
        </label>
        <label class="check-item inline-flex flex-col items-center gap-0.5" title="増締め確認">
          <AtomsCheckbox
            v-model="circuit.p1Mashishime"
            :disabled="isComplete(circuit) || editingRowId === circuit.id || circuit.isExcluded || isCircuitLocked(circuit)"
          />
          <span class="check-item-label">増締</span>
        </label>
      </div>
    </template>

    <!-- 備考 -->
    <template #cell-p1Remarks="{ row: circuit }">
      <template v-if="editingRowId === circuit.id">
        <AtomsInput
          v-model="editForm.remarks"
          type="textarea"
          :rows="2"
          placeholder="備考"
        />
      </template>
      <span v-else class="cell-text cell-remarks" :title="circuit.p1Remarks || ''">
        {{ circuit.p1Remarks || '-' }}
      </span>
    </template>

    <!-- 操作 -->
    <template #cell-actions="{ row: circuit }">
      <div class="flex items-center justify-center gap-1">
        <!-- 幹線未完了による操作不可 -->
        <template v-if="isCircuitLocked(circuit)">
          <span class="text-note inline-flex items-center gap-1">⏸ 幹線未了</span>
        </template>

        <!-- 編集モード中 -->
        <template v-else-if="editingRowId === circuit.id">
          <AtomsButton
            variant="success"
            :loading="isActionLoading[circuit.id]"
            @click="saveEdit(circuit)"
          >
            保存
          </AtomsButton>
          <AtomsButton
            variant="secondary"
            @click="cancelEdit"
          >
            取消
          </AtomsButton>
        </template>

        <!-- 通常モード：確定済み -->
        <template v-else-if="isComplete(circuit)">
          <AtomsButton
            variant="danger"
            :loading="isActionLoading[circuit.id]"
            @click="$emit('clear', circuit)"
          >
            解除
          </AtomsButton>
        </template>

        <!-- 通常モード：未確定 -->
        <template v-else>
          <AtomsButton
            variant="primary"
            :disabled="!circuit.p1Kakunin || !circuit.p1Mashishime || circuit.isExcluded"
            :loading="isActionLoading[circuit.id]"
            @click="$emit('confirm', circuit)"
          >
            確定
          </AtomsButton>
          <AtomsButton
            variant="secondary"
            :disabled="circuit.isExcluded"
            @click="startEdit(circuit)"
          >
            編集
          </AtomsButton>
        </template>
      </div>
    </template>

    <!-- 測定者 / 日時 -->
    <template #cell-p1ConfirmedAt="{ row: circuit }">
      <PortalMoleculesSoudenWorkerCell
        :worker="circuit.p1Worker"
        :confirmed-at="circuit.p1ConfirmedAt"
      />
    </template>
  </PortalOrganismsSoudenCircuitTable>
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

.cell-text {
  font-size: inherit;
  color: var(--color-text-main);
}

.cell-meisho {
  display: block;

  max-width: 100%;

  font-size: inherit;
  font-weight: var(--font-weight-normal);
  line-height: 1.3;
  color: var(--color-text-main);
  white-space: pre-line;
}

.cell-remarks {
  overflow: hidden;
  display: block;

  max-width: 100%;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-note {
  font-size: inherit;
  font-weight: var(--font-weight-normal);
  color: var(--color-status-warning);
}

.check-item {
  cursor: pointer;

  &-label {
    user-select: none;
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
  }
}
</style>
