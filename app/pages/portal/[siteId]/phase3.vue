<script setup lang="ts">
/**
 * Phase 3 View
 * フェーズ3：送電・電圧測定・検相
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { useHead, useRoute } from '#app'
import ExamMinimap from '~/components/Portal/ExamMinimap.vue'
import { usePhaseExam } from '~/composables/portal/usePhaseExam'
import { useTableSort } from '~/composables/useTableSort'
import type { TableColumn } from '~/types/components'
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

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)

  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
  <div class="p-phase3">
    <AppSectionHeader
      title="フェーズ3：送電・電圧測定・検相"
      icon="zap"
      size="lg"
    >
      <template #actions>
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
    <AppPanel variant="hud">
      <div class="p-phase3-controls">
        <div class="p-phase3-controls__filters">
          <!-- 盤種別タブ -->
          <div class="p-phase3-controls__row">
            <span class="p-phase3-controls__label">盤種別:</span>
            <AppTabs
              v-model="selectedBanShubetsu"
              :options="shubetsuTabOptions"
              variant="pills"
            />
          </div>

          <!-- 盤名称セレクト & 件数表示 -->
          <div class="p-phase3-controls__row p-phase3-controls__row--inline">
            <div class="p-phase3-controls__select-group">
              <span class="p-phase3-controls__label">盤名称:</span>
              <AppSelect
                v-model="selectedBanMeisho"
                :options="availableBanMeishoList"
                class="p-phase3-controls__select"
              />
            </div>

            <AppBadge color="var(--theme-accent)">
              対象回路: {{ phaseStats.allCount }} 件
            </AppBadge>
          </div>
        </div>

        <!-- 全体進捗バー & ミニマップ -->
        <div class="p-phase3-controls__progress">
          <AppProgressBar
            label="フェーズ3 進捗状況"
            :completed="phaseStats.completed"
            :total="phaseStats.total"
            :excluded="phaseStats.excluded"
            :pct="phaseStats.pct"
            variant="success"
          />

          <!-- ミニマップ -->
          <ExamMinimap
            :circuits="sortedCircuits"
            :phase="3"
            @select-circuit="scrollToCircuit"
          />
        </div>
      </div>
    </AppPanel>

    <!-- 回路一覧テーブル -->
    <div class="p-phase3__table-wrapper">
      <AppTable
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
              'p-phase3-row',
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
              <div class="p-phase3-cell__panel">
                <span class="p-phase3-cell__ban-name">{{ circuit.banMeisho }}</span>
                <span class="p-phase3-cell__shubetsu">{{ circuit.banShubetsu }}</span>
              </div>
            </td>

            <!-- 回路番号 -->
            <td style="text-align: center;">
              <div class="p-phase3-cell__bangou-wrap">
                <span class="p-phase3-cell__type-badge" :class="{ 'is-three': isThreePhase(circuit) }">
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
              <span class="p-phase3-cell__meisho" :title="circuit.kairoMeisho || ''">
                {{ circuit.kairoMeisho || '-' }}
              </span>
            </td>

            <!-- 電圧 1 (RS / RN) -->
            <td style="text-align: center;">
              <template v-if="editingRowId === circuit.id">
                <div class="p-phase3-input-cell">
                  <span class="p-phase3-input-cell__label">{{ getPhaseLabels(circuit).label1 }}</span>
                  <div class="p-phase3-input-cell__box">
                    <input
                      v-model="inputForm.rs"
                      type="number"
                      step="1"
                      class="p-phase3-input"
                    >
                    <span class="p-phase3-input-cell__unit">V</span>
                  </div>
                </div>
              </template>
              <div v-else class="p-phase3-volt-cell">
                <span class="p-phase3-volt-cell__label">{{ getPhaseLabels(circuit).label1 }}</span>
                <div class="p-phase3-volt-cell__val-group">
                  <span
                    class="p-phase3-volt-cell__val"
                    :class="{ 'is-active': circuit.denatsuRs !== null && circuit.denatsuRs !== undefined }"
                  >
                    {{ formatVoltage(circuit.denatsuRs) }}
                  </span>
                  <span v-if="circuit.denatsuRs !== null && circuit.denatsuRs !== undefined" class="p-phase3-volt-cell__unit">V</span>
                </div>
              </div>
            </td>

            <!-- 電圧 2 (ST / TN) -->
            <td style="text-align: center;">
              <template v-if="editingRowId === circuit.id">
                <div class="p-phase3-input-cell">
                  <span class="p-phase3-input-cell__label">{{ getPhaseLabels(circuit).label2 }}</span>
                  <div class="p-phase3-input-cell__box">
                    <input
                      v-model="inputForm.st"
                      type="number"
                      step="1"
                      class="p-phase3-input"
                    >
                    <span class="p-phase3-input-cell__unit">V</span>
                  </div>
                </div>
              </template>
              <div v-else class="p-phase3-volt-cell">
                <span class="p-phase3-volt-cell__label">{{ getPhaseLabels(circuit).label2 }}</span>
                <div class="p-phase3-volt-cell__val-group">
                  <span
                    class="p-phase3-volt-cell__val"
                    :class="{ 'is-active': circuit.denatsuSt !== null && circuit.denatsuSt !== undefined }"
                  >
                    {{ formatVoltage(circuit.denatsuSt) }}
                  </span>
                  <span v-if="circuit.denatsuSt !== null && circuit.denatsuSt !== undefined" class="p-phase3-volt-cell__unit">V</span>
                </div>
              </div>
            </td>

            <!-- 電圧 3 (RT / RT) -->
            <td style="text-align: center;">
              <template v-if="editingRowId === circuit.id">
                <div class="p-phase3-input-cell">
                  <span class="p-phase3-input-cell__label">{{ getPhaseLabels(circuit).label3 }}</span>
                  <div class="p-phase3-input-cell__box">
                    <input
                      v-model="inputForm.rt"
                      type="number"
                      step="1"
                      class="p-phase3-input"
                    >
                    <span class="p-phase3-input-cell__unit">V</span>
                  </div>
                </div>
              </template>
              <div v-else class="p-phase3-volt-cell">
                <span class="p-phase3-volt-cell__label">{{ getPhaseLabels(circuit).label3 }}</span>
                <div class="p-phase3-volt-cell__val-group">
                  <span
                    class="p-phase3-volt-cell__val"
                    :class="{ 'is-active': circuit.denatsuRt !== null && circuit.denatsuRt !== undefined }"
                  >
                    {{ formatVoltage(circuit.denatsuRt) }}
                  </span>
                  <span v-if="circuit.denatsuRt !== null && circuit.denatsuRt !== undefined" class="p-phase3-volt-cell__unit">V</span>
                </div>
              </div>
            </td>

            <!-- 検相 / 点灯確認 -->
            <td style="text-align: center;">
              <template v-if="editingRowId === circuit.id">
                <select v-model="inputForm.kensou" class="p-phase3-select">
                  <template v-if="isThreePhase(circuit)">
                    <option value="正相">
                      正相
                    </option>
                    <option value="逆相">
                      逆相
                    </option>
                  </template>
                  <template v-else>
                    <option value="点灯確認(良)">
                      点灯確認(良)
                    </option>
                    <option value="点灯確認(否)">
                      点灯確認(否)
                    </option>
                  </template>
                </select>
              </template>
              <template v-else-if="circuit.kensou">
                <AppBadge
                  :color="circuit.kensou === '正相' || circuit.kensou === '点灯確認(良)' ? 'var(--color-status-success)' : 'var(--color-status-danger)'"
                >
                  {{ circuit.kensou }}
                </AppBadge>
              </template>
              <span v-else class="p-phase3-cell__dash">-</span>
            </td>

            <!-- 備考 -->
            <td>
              <template v-if="editingRowId === circuit.id">
                <AppInput v-model="inputForm.remarks" size="sm" placeholder="備考" />
              </template>
              <span v-else class="p-phase3-cell__remarks" :title="circuit.p3Remarks || ''">
                {{ circuit.p3Remarks || '-' }}
              </span>
            </td>

            <!-- 操作 -->
            <td style="text-align: center;">
              <div class="p-phase3-actions">
                <!-- 幹線未完了による操作不可 -->
                <template v-if="isCircuitLocked(circuit)">
                  <span class="c-text-note c-text-note--strong">⏸ 幹線未了</span>
                </template>

                <!-- 前フェーズ（P2）未完了による操作不可 -->
                <template v-else-if="!isP2Complete(circuit)">
                  <span class="c-text-note c-text-note--strong">⏸ P2未了</span>
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
              <template v-if="circuit.p3Worker">
                <div class="p-phase3-cell__worker">
                  <strong>{{ circuit.p3Worker }}</strong>
                  <span class="p-phase3-cell__date">{{ formatDate(circuit.p3ConfirmedAt) }}</span>
                </div>
              </template>
              <span v-else class="p-phase3-cell__dash">-</span>
            </td>
          </tr>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-phase3 {
  @include flex-start-stretch($direction: column);

  gap: var(--space-section-gap);
  height: 100%;

  &__table-wrapper {
    flex: 1;
    min-height: 400px;
  }
}

.p-phase3-controls {
  @include grid(1fr 1fr, var(--space-card-gap));

  align-items: flex-start;

  @include mq("lg") {
    grid-template-columns: 1fr;
  }

  &__filters {
    @include flex-start-stretch($direction: column);

    gap: var(--space-3);
  }

  &__row {
    display: flex;
    gap: var(--space-3);
    align-items: center;

    &--inline {
      flex-wrap: wrap;
    }
  }

  &__label {
    min-width: 50px;
    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
  }

  &__select-group {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  &__select {
    min-width: 160px;
  }

  &__progress {
    @include flex-start-stretch($direction: column);

    gap: var(--space-3);
  }
}

.p-phase3-row {
  transition: background-color 0.2s ease;

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

.p-phase3-cell {
  &__panel {
    @include flex-start-stretch($direction: column);

    overflow: hidden;
    gap: 2px;
  }

  &__ban-name {
    overflow: hidden;

    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__shubetsu {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  &__bangou-wrap {
    @include flex-center-center;

    flex-direction: column;
    gap: 3px;
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

  &__worker {
    @include flex-start-stretch($direction: column);

    gap: 2px;
    align-items: center;

    strong {
      font-size: var(--text-xs);
      color: var(--color-status-success);
    }
  }

  &__date {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-muted);
  }

  &__dash {
    color: var(--color-text-muted);
  }
}

.p-phase3-volt-cell {
  @include flex-start-stretch($direction: column);

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

.p-phase3-input-cell {
  @include flex-start-stretch($direction: column);

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

.p-phase3-input {
  width: 52px;
  padding: 2px 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);

  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-main);
  text-align: right;

  background-color: rgb(255 255 255 / 8%);

  &:focus {
    border-color: var(--color-category-main, #3b82f6);
    outline: none;
  }
}

.p-phase3-select {
  padding: 3px 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);

  font-size: var(--text-xs);
  color: var(--color-text-main);

  background-color: rgb(255 255 255 / 8%);

  &:focus {
    border-color: var(--color-category-main, #3b82f6);
    outline: none;
  }
}

.p-phase3-actions {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;
}

.c-text-note {
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
