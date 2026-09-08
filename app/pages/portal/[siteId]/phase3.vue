<script setup lang="ts">
/**
 * Phase 3 View
 * フェーズ3：送電・電圧測定・検相
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { usePhaseExam } from '~/composables/portal/usePhaseExam'
import { useTableSort } from '~/composables/useTableSort'
import type { SelectOption, TableColumn } from '~/types/components'
import type { CircuitItem } from '~/types/souden'

useHead({ title: 'フェーズ3：送電・電圧測定・検相 - Elec-Console' })

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const initialKeiTo = computed(() => (route.query.kei_to as string) || '幹線')

const {
  filteredCircuits,
  availableShubetsuList,
  availableBanMeishoList,
  selectedKeiTo,
  selectedBanShubetsu,
  selectedBanMeisho,
  phaseStats,
  isCircuitLocked,
  isActionLoading,
  isBatchLoading,
  isThreePhase,
  fetchCircuits,
  confirmPhase3,
  clearPhase3,
  batchConfirmPhase3,
} = usePhaseExam(siteId, initialKeiTo.value, 3)

// 各行の編集・手入力状態
const editingRowId = ref<string | null>(null)
const inputForm = reactive({
  rs: '' as string | number,
  st: '' as string | number,
  rt: '' as string | number,
  kensou: '正相',
  remarks: '',
})

watch(
  () => route.query.kei_to,
  (newKeiTo) => {
    if (newKeiTo && typeof newKeiTo === 'string') {
      selectedKeiTo.value = newKeiTo
      fetchCircuits()
    }
  },
)

watch(selectedKeiTo, () => {
  selectedBanShubetsu.value = 'ALL'
  selectedBanMeisho.value = 'ALL'
  fetchCircuits()
})

onMounted(() => {
  fetchCircuits()
})

const isComplete = (c: CircuitItem) => {
  return Boolean(c.p3ConfirmedAt)
}

const isP2Complete = (c: CircuitItem) => {
  return Boolean(c.p2ConfirmedAt && c.p2IsComplete)
}

const scrollToCircuit = (circuit: CircuitItem) => {
  const el = document.getElementById(`row-${circuit.id}`)

  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('is-highlighted')
    setTimeout(() => el.classList.remove('is-highlighted'), 2000)
  }
}

const shubetsuTabOptions = computed(() => {
  return availableShubetsuList.value.map(s => ({
    label: s === 'ALL' ? 'すべて' : s,
    value: s,
  }))
})

// 相ラベルの取得
const getPhaseLabels = (circuit: CircuitItem) => {
  if (isThreePhase(circuit)) {
    return {
      label1: 'R - S',
      label2: 'S - T',
      label3: 'R - T',
      defaultRs: 210,
      defaultSt: 210,
      defaultRt: 210,
      defaultKensou: '正相',
      typeText: '動力（三相）',
    }
  }

  return {
    label1: 'R - N',
    label2: 'T - N',
    label3: 'R - T',
    defaultRs: 105,
    defaultSt: 105,
    defaultRt: 210,
    defaultKensou: '点灯確認(良)',
    typeText: '電灯（単相）',
  }
}

// 検相 / 点灯確認の選択肢
const getKensouOptions = (circuit: CircuitItem): SelectOption[] => {
  return isThreePhase(circuit)
    ? [
        { label: '正相', value: '正相' },
        { label: '逆相', value: '逆相' },
      ]
    : [
        { label: '点灯確認(良)', value: '点灯確認(良)' },
        { label: '点灯確認(否)', value: '点灯確認(否)' },
      ]
}

// 電圧フォーマット（数値と単位を分離して表示）
const formatVoltage = (val: number | null | undefined) => {
  if (val === null || val === undefined) return '-'

  return String(val)
}

// クイック標準値確定
const handleQuickStandard = async (circuit: CircuitItem) => {
  const labels = getPhaseLabels(circuit)

  await confirmPhase3(circuit, {
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
const saveInput = async (circuit: CircuitItem) => {
  const rsNum = typeof inputForm.rs === 'string' && inputForm.rs !== '' ? parseFloat(inputForm.rs) : typeof inputForm.rs === 'number' ? inputForm.rs : null
  const stNum = typeof inputForm.st === 'string' && inputForm.st !== '' ? parseFloat(inputForm.st) : typeof inputForm.st === 'number' ? inputForm.st : null
  const rtNum = typeof inputForm.rt === 'string' && inputForm.rt !== '' ? parseFloat(inputForm.rt) : typeof inputForm.rt === 'number' ? inputForm.rt : null

  await confirmPhase3(circuit, {
    rs: rsNum,
    st: stNum,
    rt: rtNum,
    kensou: inputForm.kensou,
    remarks: inputForm.remarks,
  })

  editingRowId.value = null
}

// テーブルカラム定義とソート
const columns: TableColumn<CircuitItem>[] = [
  { key: 'banMeisho', label: '盤情報', sortable: true, width: '95px' },
  { key: 'kairoBangou', label: '回路番号', sortable: true, width: '80px', align: 'center' },
  { key: 'kairoMeisho', label: '回路名称', sortable: true, width: '135px' },
  { key: 'denatsuRs', label: '電圧1', sortable: true, width: '75px', align: 'center' },
  { key: 'denatsuSt', label: '電圧2', sortable: true, width: '75px', align: 'center' },
  { key: 'denatsuRt', label: '電圧3', sortable: true, width: '75px', align: 'center' },
  { key: 'kensou', label: '検相 / 点灯', sortable: true, width: '100px', align: 'center' },
  { key: 'p3Remarks', label: '備考', sortable: true },
  { key: 'actions', label: '操作', width: '125px', align: 'center' },
  { key: 'p3ConfirmedAt', label: '測定者 / 日時', sortable: true, width: '115px', align: 'center' },
]

const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
  handleSort,
} = useTableSort(filteredCircuits)
</script>

<template>
  <div class="phase3">
    <AppSectionHeader
      title="フェーズ3：送電・電圧測定・検相"
      icon="zap"
      size="lg"
    >
      <template #actions>
        <PortalSyncStatusBadge
          :site-id="siteId"
          @synced="fetchCircuits"
        />

        <AppButton
          variant="primary"
          size="sm"
          :loading="isBatchLoading"
          @click="batchConfirmPhase3"
        >
          <AppIcon name="check-check" size="sm" />
          一括標準値確定
        </AppButton>

        <AppButton
          :to="`/portal/${siteId}/souden`"
          variant="secondary"
          size="sm"
        >
          <AppIcon name="arrow-left" size="sm" />
          ダッシュボードへ戻る
        </AppButton>
      </template>
    </AppSectionHeader>

    <!-- 検索・絞り込み ＆ 進捗コントロールパネル -->
    <PortalSoudenPhaseControls
      v-model:shubetsu="selectedBanShubetsu"
      v-model:ban-meisho="selectedBanMeisho"
      :shubetsu-options="shubetsuTabOptions"
      :ban-meisho-options="availableBanMeishoList"
      :stats="phaseStats"
      :circuits="sortedCircuits"
      :phase="3"
      @select-circuit="scrollToCircuit"
    />

    <!-- 回路一覧テーブル -->
    <AppTable
      class="phase3__table"
      :columns="columns"
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
              <span class="phase3-cell__type-badge" :class="{ 'is-three': isThreePhase(circuit) }">
                {{ isThreePhase(circuit) ? '動力' : '電灯' }}
              </span>
              <AppKairoIcon
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
                <div class="phase3-input-cell__box">
                  <AppInput
                    v-model="inputForm.rs"
                    type="number"
                    size="sm"
                    step="any"
                    inputmode="decimal"
                    style="width: 58px;"
                    @focus="handleInputFocus"
                    @keydown.enter.prevent="saveInput(circuit)"
                  />
                  <span class="phase3-input-cell__unit">V</span>
                </div>
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
                <div class="phase3-input-cell__box">
                  <AppInput
                    v-model="inputForm.st"
                    type="number"
                    size="sm"
                    step="any"
                    inputmode="decimal"
                    style="width: 58px;"
                    @focus="handleInputFocus"
                    @keydown.enter.prevent="saveInput(circuit)"
                  />
                  <span class="phase3-input-cell__unit">V</span>
                </div>
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
                <div class="phase3-input-cell__box">
                  <AppInput
                    v-model="inputForm.rt"
                    type="number"
                    size="sm"
                    step="any"
                    inputmode="decimal"
                    style="width: 58px;"
                    @focus="handleInputFocus"
                    @keydown.enter.prevent="saveInput(circuit)"
                  />
                  <span class="phase3-input-cell__unit">V</span>
                </div>
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
              <AppBadge
                :color="circuit.kensou === '正相' || circuit.kensou === '点灯確認(良)' ? 'var(--color-status-success)' : 'var(--color-status-danger)'"
              >
                {{ circuit.kensou }}
              </AppBadge>
            </template>
            <span v-else class="phase3-cell__dash">-</span>
          </td>

          <!-- 備考 -->
          <td>
            <template v-if="editingRowId === circuit.id">
              <AppInput v-model="inputForm.remarks" size="sm" placeholder="備考" />
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
                <AppButton
                  variant="success"
                  size="sm"
                  :loading="isActionLoading[circuit.id]"
                  @click="saveInput(circuit)"
                >
                  確定
                </AppButton>
                <AppButton
                  variant="secondary"
                  size="sm"
                  @click="cancelInput"
                >
                  取消
                </AppButton>
              </template>

              <!-- 通常モード：確定済み -->
              <template v-else-if="isComplete(circuit)">
                <AppButton
                  variant="danger"
                  size="sm"
                  :loading="isActionLoading[circuit.id]"
                  @click="clearPhase3(circuit)"
                >
                  解除
                </AppButton>
                <AppButton
                  variant="secondary"
                  size="sm"
                  @click="startInput(circuit)"
                >
                  変更
                </AppButton>
              </template>

              <!-- 通常モード：未確定 -->
              <template v-else>
                <AppButton
                  variant="primary"
                  size="sm"
                  :disabled="circuit.isExcluded"
                  :loading="isActionLoading[circuit.id]"
                  @click="handleQuickStandard(circuit)"
                >
                  標準値確定
                </AppButton>
                <AppButton
                  variant="secondary"
                  size="sm"
                  :disabled="circuit.isExcluded"
                  @click="startInput(circuit)"
                >
                  手入力
                </AppButton>
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
  </div>
</template>

<style scoped lang="scss">
.phase3 {
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap);
  height: 100%;

  &__table {
    flex: 1;
    min-height: 400px;
  }
}

.phase3-row {
  transition: background-color var(--duration-base) var(--ease-base);

  &.is-completed {
    background-color: rgb(34 197 94 / 5%);
  }

  &.is-excluded {
    opacity: 0.5;
  }

  &.is-locked {
    opacity: 0.6;
  }

  &.is-highlighted {
    background-color: rgb(59 130 246 / 25%) !important;
    outline: 2px solid #3b82f6;
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
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: var(--radius-sm);

    font-size: 10px;
    color: var(--color-text-muted);

    background-color: rgb(255 255 255 / 6%);

    &.is-three {
      border-color: rgb(245 158 11 / 30%);
      color: #f59e0b;
      background-color: rgb(245 158 11 / 10%);
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
    color: var(--color-text-muted);
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
    color: var(--color-text-muted);

    &.is-active {
      color: var(--color-status-info, #38bdf8);
    }
  }

  &__unit {
    font-family: var(--font-sans);
    font-size: 10px;
    color: var(--color-text-muted);
  }
}

.phase3-input-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;

  &__label {
    font-size: 10px;
    color: var(--color-text-muted);
  }

  &__box {
    display: flex;
    gap: 2px;
    align-items: center;
  }

  &__unit {
    font-size: 10px;
    color: var(--color-text-muted);
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
  color: var(--color-status-warning, #f59e0b);

  &--strong {
    font-weight: var(--font-weight-bold, 700);
  }
}
</style>
