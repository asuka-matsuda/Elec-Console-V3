<script setup lang="ts">
/**
 * PortalPhase1Table
 * フェーズ1（回路確認・増し締め）の回路一覧テーブルOrganismコンポーネント。
 * 回路確認・増締めチェック、インライン編集（回路番号・名称・配線・備考）、確定および解除操作を管理します。
 */
import { computed, reactive, ref } from 'vue'

import { useTableSort } from '~/composables/useTableSort'
import { PHASE1_TABLE_COLUMNS } from '~/constants/soudenConstants'
import type { CircuitItem } from '~/types/souden'

const props = defineProps<{
  circuits: CircuitItem[]
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
  <MoleculesTable
    class="portal-phase1-table"
    :columns="PHASE1_TABLE_COLUMNS"
    :data="sortedCircuits"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    @sort="handleSort"
  >
    <template #body>
      <tr
        v-for="circuit in sortedCircuits"
        :id="`row-${circuit.id}`"
        :key="circuit.id"
        :class="[
          'phase1-row',
          {
            'is-completed': isComplete(circuit),
            'is-excluded': circuit.isExcluded,
            'is-locked': isCircuitLocked(circuit),
            'is-editing': editingRowId === circuit.id,
          },
        ]"
      >
        <!-- 盤種別 / 盤名称 -->
        <td>
          <PortalSoudenBanCell
            :ban-meisho="circuit.banMeisho"
            :ban-shubetsu="circuit.banShubetsu"
          />
        </td>

        <!-- 回路番号 -->
        <td style="text-align: center;">
          <template v-if="editingRowId === circuit.id">
            <AtomsInput v-model="editForm.kairoBangou" size="sm" placeholder="番号" />
          </template>
          <div v-else class="phase1-cell__bangou-wrap">
            <AtomsPortalKairoSymbol
              :kigou="circuit.kairoKigou"
              :bangou="circuit.kairoBangou"
            />
          </div>
        </td>

        <!-- 回路名称 -->
        <td>
          <template v-if="editingRowId === circuit.id">
            <AtomsInput v-model="editForm.kairoMeisho" size="sm" placeholder="回路名称" />
          </template>
          <span v-else class="phase1-cell__text phase1-cell__meisho" :title="circuit.kairoMeisho || ''">
            {{ circuit.kairoMeisho || '-' }}
          </span>
        </td>

        <!-- 配線 / 接地 -->
        <td>
          <template v-if="editingRowId === circuit.id">
            <div class="phase1-cell__edit-col">
              <div class="phase1-cell__inline-inputs">
                <AtomsInput v-model="editForm.cableList" size="sm" placeholder="ケーブル" />
                <AtomsInput v-model="editForm.haisenJousuu" size="sm" placeholder="条数" style="width: 55px;" />
              </div>
              <AtomsInput v-model="editForm.setsuchiList" size="sm" placeholder="接地リスト" />
            </div>
          </template>
          <div v-else class="phase1-cell__wiring">
            <div class="phase1-cell__cable-line">
              <span class="phase1-cell__cable">{{ circuit.cableList || '-' }}</span>
              <span v-if="circuit.haisenJousuu" class="phase1-cell__jousuu">({{ circuit.haisenJousuu }})</span>
            </div>
            <span class="phase1-cell__setsuchi" :title="circuit.setsuchiList || ''">
              {{ circuit.setsuchiList ? `E: ${circuit.setsuchiList}` : '-' }}
            </span>
          </div>
        </td>

        <!-- 確認 / 増締め (チェックボックス) -->
        <td style="text-align: center;">
          <div class="phase1-cell__checks">
            <label class="phase1-check-item" title="回路確認">
              <AtomsCheckbox
                v-model="circuit.p1Kakunin"
                :disabled="isComplete(circuit) || editingRowId === circuit.id || circuit.isExcluded || isCircuitLocked(circuit)"
              />
              <span class="phase1-check-item__label">確認</span>
            </label>
            <label class="phase1-check-item" title="増締め確認">
              <AtomsCheckbox
                v-model="circuit.p1Mashishime"
                :disabled="isComplete(circuit) || editingRowId === circuit.id || circuit.isExcluded || isCircuitLocked(circuit)"
              />
              <span class="phase1-check-item__label">増締</span>
            </label>
          </div>
        </td>

        <!-- 備考 -->
        <td>
          <template v-if="editingRowId === circuit.id">
            <AtomsInput v-model="editForm.remarks" size="sm" placeholder="備考" />
          </template>
          <span v-else class="phase1-cell__text phase1-cell__remarks">
            {{ circuit.p1Remarks || '-' }}
          </span>
        </td>

        <!-- 操作 -->
        <td style="text-align: center;">
          <div class="phase1-actions">
            <!-- 幹線未完了による操作不可 -->
            <template v-if="isCircuitLocked(circuit)">
              <span class="text-note text-note--strong">⏸ 幹線未了</span>
            </template>

            <!-- 編集モード中 -->
            <template v-else-if="editingRowId === circuit.id">
              <AtomsButton
                variant="success"
                size="sm"
                :loading="isActionLoading[circuit.id]"
                @click="saveEdit(circuit)"
              >
                保存
              </AtomsButton>
              <AtomsButton
                variant="secondary"
                size="sm"
                @click="cancelEdit"
              >
                取消
              </AtomsButton>
            </template>

            <!-- 通常モード：確定済み -->
            <template v-else-if="isComplete(circuit)">
              <AtomsButton
                variant="danger"
                size="sm"
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
                size="sm"
                :disabled="!circuit.p1Kakunin || !circuit.p1Mashishime || circuit.isExcluded"
                :loading="isActionLoading[circuit.id]"
                @click="$emit('confirm', circuit)"
              >
                確定
              </AtomsButton>
              <AtomsButton
                variant="secondary"
                size="sm"
                :disabled="circuit.isExcluded"
                @click="startEdit(circuit)"
              >
                編集
              </AtomsButton>
            </template>
          </div>
        </td>

        <!-- 測定者 / 日時 -->
        <td style="text-align: center;">
          <PortalSoudenWorkerCell
            :worker="circuit.p1Worker"
            :confirmed-at="circuit.p1ConfirmedAt"
          />
        </td>
      </tr>
    </template>
  </MoleculesTable>
</template>

<style scoped lang="scss">
.portal-phase1-table {
  flex: 1;
  min-height: 400px;
}

.phase1-row {
  transition: background-color var(--duration-base) var(--ease-base);

  &.is-completed {
    background-color: var(--color-completed-row-bg);
  }

  &.is-excluded {
    opacity: 0.5;
  }

  &.is-locked {
    opacity: 0.6;
  }

  &.is-highlighted {
    background-color: var(--color-selection-bg) !important;
    outline: 2px solid var(--color-selection-outline);
  }
}

.phase1-cell {
  &__bangou-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__wiring {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__cable-line {
    display: flex;
    gap: var(--space-1);
    align-items: center;
  }

  &__cable {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-main);
  }

  &__jousuu {
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  &__setsuchi {
    overflow: hidden;

    max-width: 140px;

    font-size: 11px;
    color: var(--color-text-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__checks {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    justify-content: center;
  }

  &__edit-col {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__inline-inputs {
    display: flex;
    gap: var(--space-1);
    align-items: center;
  }

  &__text {
    font-size: var(--text-xs);
    color: var(--color-text-main);
  }

  &__meisho {
    overflow: hidden;
    display: block;

    max-width: 100%;

    font-size: var(--text-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-main);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__remarks {
    overflow: hidden;
    max-width: 160px;
    text-overflow: ellipsis;
  }
}

.phase1-actions {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;
}

.text-note {
  display: inline-flex;
  gap: 4px;
  align-items: center;

  font-size: var(--text-xs);
  color: var(--color-status-warning);

  &--strong {
    font-weight: var(--font-weight-bold, 700);
  }
}

.phase1-check-item {
  cursor: pointer;

  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;

  &__label {
    user-select: none;
    font-size: 10px;
    color: var(--color-text-muted);
  }
}
</style>
