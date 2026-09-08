<script setup lang="ts">
/**
 * PortalPhase3Table
 * フェーズ3（送電・電圧測定・検相）の回路一覧テーブルOrganismコンポーネント。
 * 回路情報の表示、手入力モード（各相電圧・検相・備考の入力）、標準値確定、および解除の各操作を管理します。
 */
import { computed, reactive, ref } from 'vue'

import { useTableSort } from '~/composables/useTableSort'
import {
  KENSOU_OPTIONS_1P,
  KENSOU_OPTIONS_3P,
  PHASE3_TABLE_COLUMNS,
} from '~/constants/soudenConstants'
import type { SelectOption } from '~/types/components'
import type { CircuitItem } from '~/types/souden'

const props = defineProps<{
  circuits: CircuitItem[]
  isCircuitLocked: (circuit: CircuitItem) => boolean
  isActionLoading: Record<string, boolean>
  isThreePhase: (circuit: CircuitItem) => boolean
}>()

const emit = defineEmits<{
  confirm: [
    circuit: CircuitItem,
    values: {
      rs: number | null
      st: number | null
      rt: number | null
      kensou?: string
      remarks?: string
    },
  ]
  clear: [circuit: CircuitItem]
}>()

// 各行の編集・手入力状態
const editingRowId = ref<string | null>(null)
const inputForm = reactive({
  rs: '' as string | number,
  st: '' as string | number,
  rt: '' as string | number,
  kensou: '正相',
  remarks: '',
})

const isComplete = (c: CircuitItem) => Boolean(c.p3ConfirmedAt)
const isP2Complete = (c: CircuitItem) => Boolean(c.p2ConfirmedAt && c.p2IsComplete)

// 相ラベルの取得
const getPhaseLabels = (circuit: CircuitItem) => {
  if (props.isThreePhase(circuit)) {
    return {
      label1: 'R - S',
      label2: 'S - T',
      label3: 'R - T',
      defaultRs: 200,
      defaultSt: 200,
      defaultRt: 200,
      defaultKensou: '正相',
    }
  }

  return {
    label1: 'R - N',
    label2: 'T - N',
    label3: 'R - T',
    defaultRs: 100,
    defaultSt: 100,
    defaultRt: 200,
    defaultKensou: '点灯確認(良)',
  }
}

// 検相セレクトの選択肢
const getKensouOptions = (circuit: CircuitItem): SelectOption[] => {
  return props.isThreePhase(circuit) ? KENSOU_OPTIONS_3P : KENSOU_OPTIONS_1P
}

// 電圧フォーマット
const formatVoltage = (val: number | null | undefined) => {
  if (val === null || val === undefined) return '-'

  return `${val}`
}

// 標準値確定
const handleQuickStandard = (circuit: CircuitItem) => {
  const labels = getPhaseLabels(circuit)

  emit('confirm', circuit, {
    rs: labels.defaultRs,
    st: labels.defaultSt,
    rt: labels.defaultRt,
    kensou: labels.defaultKensou,
  })
}

// 手入力モードの開始
const startInput = (circuit: CircuitItem) => {
  const labels = getPhaseLabels(circuit)

  editingRowId.value = circuit.id
  inputForm.rs = circuit.denatsuRs ?? labels.defaultRs
  inputForm.st = circuit.denatsuSt ?? labels.defaultSt
  inputForm.rt = circuit.denatsuRt ?? labels.defaultRt
  inputForm.kensou = circuit.kensou || labels.defaultKensou
  inputForm.remarks = circuit.p3Remarks ?? ''
}

const cancelInput = () => {
  editingRowId.value = null
}

const handleInputFocus = (event: FocusEvent) => {
  const target = event.target as HTMLInputElement | null

  if (target) {
    target.select()
  }
}

// 手入力内容の確定
const saveInput = (circuit: CircuitItem) => {
  const rsNum = typeof inputForm.rs === 'string' && inputForm.rs !== '' ? parseFloat(inputForm.rs) : typeof inputForm.rs === 'number' ? inputForm.rs : null
  const stNum = typeof inputForm.st === 'string' && inputForm.st !== '' ? parseFloat(inputForm.st) : typeof inputForm.st === 'number' ? inputForm.st : null
  const rtNum = typeof inputForm.rt === 'string' && inputForm.rt !== '' ? parseFloat(inputForm.rt) : typeof inputForm.rt === 'number' ? inputForm.rt : null

  emit('confirm', circuit, {
    rs: rsNum,
    st: stNum,
    rt: rtNum,
    kensou: inputForm.kensou,
    remarks: inputForm.remarks,
  })

  editingRowId.value = null
}

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
  <AppTable
    class="portal-phase3-table"
    :columns="PHASE3_TABLE_COLUMNS"
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
          'phase3-row',
          {
            'is-completed': isComplete(circuit),
            'is-excluded': circuit.isExcluded,
            'is-locked': isCircuitLocked(circuit) || !isP2Complete(circuit),
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
          <div class="phase3-cell__bangou-wrap">
            <AtomsBadge :color="isThreePhase(circuit) ? 'var(--color-status-warning)' : 'var(--color-text-muted)'">
              {{ isThreePhase(circuit) ? '動力' : '電灯' }}
            </AtomsBadge>
            <AtomsPortalKairoSymbol
              :kigou="circuit.kairoKigou"
              :bangou="circuit.kairoBangou"
            />
          </div>
        </td>

        <!-- 回路名称 -->
        <td>
          <span class="phase3-cell__meisho" :title="circuit.kairoMeisho || ''">
            {{ circuit.kairoMeisho || '-' }}
          </span>
        </td>

        <!-- 電圧 1 (RS / RN) -->
        <td style="text-align: center;">
          <template v-if="editingRowId === circuit.id">
            <div class="phase3-input-cell">
              <span class="phase3-input-cell__label">{{ getPhaseLabels(circuit).label1 }}</span>
              <AppInputGroup size="sm" style="width: 80px;">
                <AtomsInput
                  v-model="inputForm.rs"
                  type="number"
                  size="sm"
                  step="any"
                  inputmode="decimal"
                  @focus="handleInputFocus"
                  @keydown.enter.prevent="saveInput(circuit)"
                />
                <template #append>
                  <span class="input-addon">V</span>
                </template>
              </AppInputGroup>
            </div>
          </template>
          <div v-else class="phase3-volt-cell">
            <span class="phase3-volt-cell__label">{{ getPhaseLabels(circuit).label1 }}</span>
            <div class="phase3-volt-cell__val-group">
              <span
                class="phase3-volt-cell__val"
                :class="{ 'is-active': circuit.denatsuRs !== null && circuit.denatsuRs !== undefined }"
              >
                {{ formatVoltage(circuit.denatsuRs) }}
              </span>
              <span v-if="circuit.denatsuRs !== null && circuit.denatsuRs !== undefined" class="phase3-volt-cell__unit">V</span>
            </div>
          </div>
        </td>

        <!-- 電圧 2 (ST / TN) -->
        <td style="text-align: center;">
          <template v-if="editingRowId === circuit.id">
            <div class="phase3-input-cell">
              <span class="phase3-input-cell__label">{{ getPhaseLabels(circuit).label2 }}</span>
              <AppInputGroup size="sm" style="width: 80px;">
                <AtomsInput
                  v-model="inputForm.st"
                  type="number"
                  size="sm"
                  step="any"
                  inputmode="decimal"
                  @focus="handleInputFocus"
                  @keydown.enter.prevent="saveInput(circuit)"
                />
                <template #append>
                  <span class="input-addon">V</span>
                </template>
              </AppInputGroup>
            </div>
          </template>
          <div v-else class="phase3-volt-cell">
            <span class="phase3-volt-cell__label">{{ getPhaseLabels(circuit).label2 }}</span>
            <div class="phase3-volt-cell__val-group">
              <span
                class="phase3-volt-cell__val"
                :class="{ 'is-active': circuit.denatsuSt !== null && circuit.denatsuSt !== undefined }"
              >
                {{ formatVoltage(circuit.denatsuSt) }}
              </span>
              <span v-if="circuit.denatsuSt !== null && circuit.denatsuSt !== undefined" class="phase3-volt-cell__unit">V</span>
            </div>
          </div>
        </td>

        <!-- 電圧 3 (RT / RT) -->
        <td style="text-align: center;">
          <template v-if="editingRowId === circuit.id">
            <div class="phase3-input-cell">
              <span class="phase3-input-cell__label">{{ getPhaseLabels(circuit).label3 }}</span>
              <AppInputGroup size="sm" style="width: 80px;">
                <AtomsInput
                  v-model="inputForm.rt"
                  type="number"
                  size="sm"
                  step="any"
                  inputmode="decimal"
                  @focus="handleInputFocus"
                  @keydown.enter.prevent="saveInput(circuit)"
                />
                <template #append>
                  <span class="input-addon">V</span>
                </template>
              </AppInputGroup>
            </div>
          </template>
          <div v-else class="phase3-volt-cell">
            <span class="phase3-volt-cell__label">{{ getPhaseLabels(circuit).label3 }}</span>
            <div class="phase3-volt-cell__val-group">
              <span
                class="phase3-volt-cell__val"
                :class="{ 'is-active': circuit.denatsuRt !== null && circuit.denatsuRt !== undefined }"
              >
                {{ formatVoltage(circuit.denatsuRt) }}
              </span>
              <span v-if="circuit.denatsuRt !== null && circuit.denatsuRt !== undefined" class="phase3-volt-cell__unit">V</span>
            </div>
          </div>
        </td>

        <!-- 検相 / 点灯確認 -->
        <td style="text-align: center;">
          <template v-if="editingRowId === circuit.id">
            <AppSelect
              v-model="inputForm.kensou"
              :options="getKensouOptions(circuit)"
              style="min-width: 96px;"
            />
          </template>
          <template v-else-if="circuit.kensou">
            <AtomsBadge
              :color="circuit.kensou === '正相' || circuit.kensou === '点灯確認(良)' ? 'var(--color-status-success)' : 'var(--color-status-danger)'"
            >
              {{ circuit.kensou }}
            </AtomsBadge>
          </template>
          <span v-else class="phase3-cell__dash">-</span>
        </td>

        <!-- 備考 -->
        <td>
          <template v-if="editingRowId === circuit.id">
            <AtomsInput v-model="inputForm.remarks" size="sm" placeholder="備考" />
          </template>
          <span v-else class="phase3-cell__remarks" :title="circuit.p3Remarks || ''">
            {{ circuit.p3Remarks || '-' }}
          </span>
        </td>

        <!-- 操作 -->
        <td style="text-align: center;">
          <div class="phase3-actions">
            <!-- 幹線未完了による操作不可 -->
            <template v-if="isCircuitLocked(circuit)">
              <span class="text-note text-note--strong">⏸ 幹線未了</span>
            </template>

            <!-- 前フェーズ（P2）未完了による操作不可 -->
            <template v-else-if="!isP2Complete(circuit)">
              <span class="text-note text-note--strong">⏸ P2未了</span>
            </template>

            <!-- 手入力編集モード中 -->
            <template v-else-if="editingRowId === circuit.id">
              <AtomsButton
                variant="success"
                size="sm"
                :loading="isActionLoading[circuit.id]"
                @click="saveInput(circuit)"
              >
                確定
              </AtomsButton>
              <AtomsButton
                variant="secondary"
                size="sm"
                @click="cancelInput"
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
              <AtomsButton
                variant="secondary"
                size="sm"
                @click="startInput(circuit)"
              >
                変更
              </AtomsButton>
            </template>

            <!-- 通常モード：未確定 -->
            <template v-else>
              <AtomsButton
                variant="primary"
                size="sm"
                :disabled="circuit.isExcluded"
                :loading="isActionLoading[circuit.id]"
                @click="handleQuickStandard(circuit)"
              >
                標準値確定
              </AtomsButton>
              <AtomsButton
                variant="secondary"
                size="sm"
                :disabled="circuit.isExcluded"
                @click="startInput(circuit)"
              >
                手入力
              </AtomsButton>
            </template>
          </div>
        </td>

        <!-- 測定者 / 日時 -->
        <td style="text-align: center;">
          <PortalSoudenWorkerCell
            :worker="circuit.p3Worker"
            :confirmed-at="circuit.p3ConfirmedAt"
          />
        </td>
      </tr>
    </template>
  </AppTable>
</template>

<style scoped lang="scss">
.portal-phase3-table {
  flex: 1;
  min-height: 400px;
}

.phase3-row {
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

.phase3-cell {
  &__bangou-wrap {
    display: flex;
    flex-direction: column;
    gap: 3px;
    align-items: center;
    justify-content: center;
  }

  &__type-badge {
    display: inline-block;

    padding: 2px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);

    font-size: 10px;
    color: var(--color-text-muted);

    background-color: var(--color-bg-hover);

    &.is-three {
      border-color: color-mix(in srgb, var(--color-status-warning) 30%, transparent);
      color: var(--color-status-warning);
      background-color: color-mix(in srgb, var(--color-status-warning) 10%, transparent);
    }
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

    max-width: 140px;

    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__dash {
    color: var(--color-text-muted);
  }
}

.phase3-volt-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;

  &__label {
    font-size: 10px;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
  }

  &__val-group {
    display: flex;
    gap: 2px;
    align-items: baseline;
  }

  &__val {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);

    &.is-active {
      color: var(--color-category-tool);
    }
  }

  &__unit {
    font-family: var(--font-sans);
    font-size: 10px;
    color: var(--color-text-secondary);
  }
}

.phase3-input-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;

  &__label {
    font-size: 10px;
    color: var(--color-text-secondary);
  }

  &__box {
    display: flex;
    gap: 2px;
    align-items: center;
  }

  &__unit {
    font-size: 10px;
    color: var(--color-text-secondary);
  }
}

.phase3-actions {
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
</style>
