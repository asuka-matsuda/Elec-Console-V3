<script setup lang="ts">
/**
 * PortalPhase2Table
 * フェーズ2（絶縁抵抗測定・メガ測定）の回路一覧テーブルOrganismコンポーネント。
 * 回路情報の表示、手入力モード（R/S/T相の測定値入力）、全相OK確定（100MΩ）、および解除操作を管理します。
 */
import { computed, reactive, ref } from 'vue'

import { useTableSort } from '~/composables/useTableSort'
import { PHASE2_TABLE_COLUMNS } from '~/constants/soudenConstants'
import type { CircuitItem } from '~/types/souden'

const props = defineProps<{
  circuits: CircuitItem[]
  isCircuitLocked: (circuit: CircuitItem) => boolean
  isActionLoading: Record<string, boolean>
  isThreePhase: (circuit: CircuitItem) => boolean
  phase2ThresholdMegOhm: number
  evalMegStatus: (val: number | null | undefined) => 'OK' | 'NG' | null
}>()

const emit = defineEmits<{
  confirm: [
    circuit: CircuitItem,
    values: {
      rVal: number | null
      sVal: number | null
      tVal: number | null
      rStatus: string
      sStatus: string
      tStatus: string
      remarks?: string
      isComplete: boolean
    },
  ]
  clear: [circuit: CircuitItem]
}>()

// 各行の編集・手入力状態
const editingRowId = ref<string | null>(null)
const inputForm = reactive({
  rVal: '' as string | number,
  sVal: '' as string | number,
  tVal: '' as string | number,
  remarks: '',
})

const isComplete = (circuit: CircuitItem) => Boolean(circuit.p2ConfirmedAt && circuit.p2IsComplete)
const isP1Complete = (circuit: CircuitItem) => Boolean(circuit.p1ConfirmedAt && circuit.p1Kakunin && circuit.p1Mashishime)

// 相ラベルの取得
const getPhaseLabels = (circuit: CircuitItem) => {
  if (props.isThreePhase(circuit)) {
    return {
      phase1: 'R - S',
      phase2: 'S - T',
      phase3: 'R - T',
      typeText: '動力（三相）',
    }
  }

  return {
    phase1: 'R - N',
    phase2: 'T - N',
    phase3: 'R - T',
    typeText: '電灯（単相）',
  }
}

// 数値フォーマット（数値と単位を分離して表示するため）
const formatMegValue = (val: number | null | undefined) => {
  if (val === null || val === undefined) return '-'
  if (val >= 100) return '100'

  return val.toFixed(1)
}

// クイック全相OK確定（100MΩ）
const handleQuickOk = (circuit: CircuitItem) => {
  emit('confirm', circuit, {
    rVal: 100,
    sVal: 100,
    tVal: 100,
    rStatus: 'OK',
    sStatus: 'OK',
    tStatus: 'OK',
    isComplete: true,
  })
}

// 手入力モードの開始
const startInput = (circuit: CircuitItem) => {
  editingRowId.value = circuit.id
  inputForm.rVal = circuit.zetsuenR ?? 100
  inputForm.sVal = circuit.zetsuenS ?? 100
  inputForm.tVal = circuit.zetsuenT ?? 100
  inputForm.remarks = circuit.p2Remarks ?? ''
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
  const rNum = typeof inputForm.rVal === 'string' && inputForm.rVal !== '' ? parseFloat(inputForm.rVal) : typeof inputForm.rVal === 'number' ? inputForm.rVal : null
  const sNum = typeof inputForm.sVal === 'string' && inputForm.sVal !== '' ? parseFloat(inputForm.sVal) : typeof inputForm.sVal === 'number' ? inputForm.sVal : null
  const tNum = typeof inputForm.tVal === 'string' && inputForm.tVal !== '' ? parseFloat(inputForm.tVal) : typeof inputForm.tVal === 'number' ? inputForm.tVal : null

  const rStatus = props.evalMegStatus(rNum)
  const sStatus = props.evalMegStatus(sNum)
  const tStatus = props.evalMegStatus(tNum)

  const isAllOk = rStatus === 'OK' && sStatus === 'OK' && tStatus === 'OK'

  emit('confirm', circuit, {
    rVal: rNum,
    sVal: sNum,
    tVal: tNum,
    rStatus: rStatus || 'OK',
    sStatus: sStatus || 'OK',
    tStatus: tStatus || 'OK',
    remarks: inputForm.remarks,
    isComplete: isAllOk,
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
    class="portal-phase2-table"
    :columns="PHASE2_TABLE_COLUMNS"
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
          'phase2-row',
          {
            'is-completed': isComplete(circuit),
            'is-excluded': circuit.isExcluded,
            'is-locked': isCircuitLocked(circuit) || !isP1Complete(circuit),
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
          <div class="phase2-cell__bangou-wrap">
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
          <span class="phase2-cell__meisho" :title="circuit.kairoMeisho || ''">
            {{ circuit.kairoMeisho || '-' }}
          </span>
        </td>

        <!-- 測定相 1 (R-S / R-N) -->
        <td style="text-align: center;">
          <template v-if="editingRowId === circuit.id">
            <div class="phase2-input-cell">
              <span class="phase2-input-cell__label">{{ getPhaseLabels(circuit).phase1 }}</span>
              <AppInputGroup size="sm" style="width: 85px;">
                <AtomsInput
                  v-model="inputForm.rVal"
                  type="number"
                  size="sm"
                  step="0.1"
                  inputmode="decimal"
                  placeholder="100"
                  @focus="handleInputFocus"
                  @keydown.enter.prevent="saveInput(circuit)"
                />
                <template #append>
                  <span class="input-addon">MΩ</span>
                </template>
              </AppInputGroup>
            </div>
          </template>
          <div v-else class="phase2-meas-cell">
            <span class="phase2-meas-cell__label">{{ getPhaseLabels(circuit).phase1 }}</span>
            <div class="phase2-meas-cell__val-group">
              <span
                class="phase2-meas-cell__val"
                :class="{
                  'is-ok': circuit.p2RStatus === 'OK' || (circuit.zetsuenR !== null && circuit.zetsuenR !== undefined && circuit.zetsuenR >= phase2ThresholdMegOhm),
                  'is-ng': circuit.p2RStatus === 'NG' || (circuit.zetsuenR !== null && circuit.zetsuenR !== undefined && circuit.zetsuenR < phase2ThresholdMegOhm),
                }"
              >
                {{ formatMegValue(circuit.zetsuenR) }}
              </span>
              <span v-if="circuit.zetsuenR !== null && circuit.zetsuenR !== undefined" class="phase2-meas-cell__unit">MΩ</span>
            </div>
            <AtomsBadge
              v-if="circuit.p2RStatus"
              :color="circuit.p2RStatus === 'OK' ? 'var(--color-status-success)' : 'var(--color-status-danger)'"
            >
              {{ circuit.p2RStatus }}
            </AtomsBadge>
          </div>
        </td>

        <!-- 測定相 2 (S-T / T-N) -->
        <td style="text-align: center;">
          <template v-if="editingRowId === circuit.id">
            <div class="phase2-input-cell">
              <span class="phase2-input-cell__label">{{ getPhaseLabels(circuit).phase2 }}</span>
              <AppInputGroup size="sm" style="width: 85px;">
                <AtomsInput
                  v-model="inputForm.sVal"
                  type="number"
                  size="sm"
                  step="0.1"
                  inputmode="decimal"
                  placeholder="100"
                  @focus="handleInputFocus"
                  @keydown.enter.prevent="saveInput(circuit)"
                />
                <template #append>
                  <span class="input-addon">MΩ</span>
                </template>
              </AppInputGroup>
            </div>
          </template>
          <div v-else class="phase2-meas-cell">
            <span class="phase2-meas-cell__label">{{ getPhaseLabels(circuit).phase2 }}</span>
            <div class="phase2-meas-cell__val-group">
              <span
                class="phase2-meas-cell__val"
                :class="{
                  'is-ok': circuit.p2SStatus === 'OK' || (circuit.zetsuenS !== null && circuit.zetsuenS !== undefined && circuit.zetsuenS >= phase2ThresholdMegOhm),
                  'is-ng': circuit.p2SStatus === 'NG' || (circuit.zetsuenS !== null && circuit.zetsuenS !== undefined && circuit.zetsuenS < phase2ThresholdMegOhm),
                }"
              >
                {{ formatMegValue(circuit.zetsuenS) }}
              </span>
              <span v-if="circuit.zetsuenS !== null && circuit.zetsuenS !== undefined" class="phase2-meas-cell__unit">MΩ</span>
            </div>
            <AtomsBadge
              v-if="circuit.p2SStatus"
              :color="circuit.p2SStatus === 'OK' ? 'var(--color-status-success)' : 'var(--color-status-danger)'"
            >
              {{ circuit.p2SStatus }}
            </AtomsBadge>
          </div>
        </td>

        <!-- 測定相 3 (R-T / R-T) -->
        <td style="text-align: center;">
          <template v-if="editingRowId === circuit.id">
            <div class="phase2-input-cell">
              <span class="phase2-input-cell__label">{{ getPhaseLabels(circuit).phase3 }}</span>
              <AppInputGroup size="sm" style="width: 85px;">
                <AtomsInput
                  v-model="inputForm.tVal"
                  type="number"
                  size="sm"
                  step="0.1"
                  inputmode="decimal"
                  placeholder="100"
                  @focus="handleInputFocus"
                  @keydown.enter.prevent="saveInput(circuit)"
                />
                <template #append>
                  <span class="input-addon">MΩ</span>
                </template>
              </AppInputGroup>
            </div>
          </template>
          <div v-else class="phase2-meas-cell">
            <span class="phase2-meas-cell__label">{{ getPhaseLabels(circuit).phase3 }}</span>
            <div class="phase2-meas-cell__val-group">
              <span
                class="phase2-meas-cell__val"
                :class="{
                  'is-ok': circuit.p2TStatus === 'OK' || (circuit.zetsuenT !== null && circuit.zetsuenT !== undefined && circuit.zetsuenT >= phase2ThresholdMegOhm),
                  'is-ng': circuit.p2TStatus === 'NG' || (circuit.zetsuenT !== null && circuit.zetsuenT !== undefined && circuit.zetsuenT < phase2ThresholdMegOhm),
                }"
              >
                {{ formatMegValue(circuit.zetsuenT) }}
              </span>
              <span v-if="circuit.zetsuenT !== null && circuit.zetsuenT !== undefined" class="phase2-meas-cell__unit">MΩ</span>
            </div>
            <AtomsBadge
              v-if="circuit.p2TStatus"
              :color="circuit.p2TStatus === 'OK' ? 'var(--color-status-success)' : 'var(--color-status-danger)'"
            >
              {{ circuit.p2TStatus }}
            </AtomsBadge>
          </div>
        </td>

        <!-- 備考 -->
        <td>
          <template v-if="editingRowId === circuit.id">
            <AtomsInput v-model="inputForm.remarks" size="sm" placeholder="備考" />
          </template>
          <span v-else class="phase2-cell__remarks" :title="circuit.p2Remarks || ''">
            {{ circuit.p2Remarks || '-' }}
          </span>
        </td>

        <!-- 操作 -->
        <td style="text-align: center;">
          <div class="phase2-actions">
            <!-- 幹線未完了による操作不可 -->
            <template v-if="isCircuitLocked(circuit)">
              <span class="text-note text-note--strong">⏸ 幹線未了</span>
            </template>

            <!-- 前フェーズ（P1）未完了による操作不可 -->
            <template v-else-if="!isP1Complete(circuit)">
              <span class="text-note text-note--strong">⏸ P1未了</span>
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
                @click="handleQuickOk(circuit)"
              >
                全相OK
              </AtomsButton>
              <AtomsButton
                variant="secondary"
                size="sm"
                :disabled="circuit.isExcluded"
                @click="startInput(circuit)"
              >
                測定入力
              </AtomsButton>
            </template>
          </div>
        </td>

        <!-- 測定者 / 日時 -->
        <td style="text-align: center;">
          <PortalSoudenWorkerCell
            :worker="circuit.p2Worker"
            :confirmed-at="circuit.p2ConfirmedAt"
          />
        </td>
      </tr>
    </template>
  </AppTable>
</template>

<style scoped lang="scss">
.portal-phase2-table {
  flex: 1;
  min-height: 400px;
}

.phase2-row {
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

.phase2-cell {
  &__bangou-wrap {
    display: flex;
    flex-direction: column;
    gap: 3px;
    align-items: center;
    justify-content: center;
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

  &__remarks {
    overflow: hidden;

    max-width: 140px;

    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.phase2-meas-cell {
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

    &.is-ok {
      color: var(--color-status-success);
    }

    &.is-ng {
      color: var(--color-status-danger);
    }
  }

  &__unit {
    font-family: var(--font-sans);
    font-size: 10px;
    color: var(--color-text-secondary);
  }
}

.phase2-input-cell {
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

.phase2-actions {
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
