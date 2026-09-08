<script setup lang="ts">
/**
 * Phase 2 View
 * フェーズ2：絶縁抵抗測定（メガ測定）
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { useHead, useRoute } from '#app'
import ExamMinimap from '~/components/Portal/ExamMinimap.vue'
import { usePhaseExam } from '~/composables/portal/usePhaseExam'
import { useTableSort } from '~/composables/useTableSort'
import type { TableColumn } from '~/types/components'
import type { CircuitItem } from '~/types/souden'

useHead({ title: 'フェーズ2：絶縁抵抗測定 - Elec-Console' })

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
  phase2ThresholdMegOhm,
  isCircuitLocked,
  isActionLoading,
  isBatchLoading,
  isThreePhase,
  evalMegStatus,
  fetchCircuits,
  confirmPhase2,
  clearPhase2,
  batchConfirmPhase2,
} = usePhaseExam(siteId, initialKeiTo.value, 2)

// 各行の編集・手入力状態
const editingRowId = ref<string | null>(null)
const inputForm = reactive({
  rVal: '' as string | number,
  sVal: '' as string | number,
  tVal: '' as string | number,
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

const isComplete = (circuit: CircuitItem) => {
  return Boolean(circuit.p2ConfirmedAt && circuit.p2IsComplete)
}

const isP1Complete = (circuit: CircuitItem) => {
  return Boolean(circuit.p1ConfirmedAt && circuit.p1Kakunin && circuit.p1Mashishime)
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
const handleQuickOk = async (circuit: CircuitItem) => {
  await confirmPhase2(circuit, {
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
const saveInput = async (circuit: CircuitItem) => {
  const rNum = typeof inputForm.rVal === 'string' && inputForm.rVal !== '' ? parseFloat(inputForm.rVal) : typeof inputForm.rVal === 'number' ? inputForm.rVal : null
  const sNum = typeof inputForm.sVal === 'string' && inputForm.sVal !== '' ? parseFloat(inputForm.sVal) : typeof inputForm.sVal === 'number' ? inputForm.sVal : null
  const tNum = typeof inputForm.tVal === 'string' && inputForm.tVal !== '' ? parseFloat(inputForm.tVal) : typeof inputForm.tVal === 'number' ? inputForm.tVal : null

  const rStatus = evalMegStatus(rNum)
  const sStatus = evalMegStatus(sNum)
  const tStatus = evalMegStatus(tNum)

  const isAllOk = rStatus === 'OK' && sStatus === 'OK' && tStatus === 'OK'

  await confirmPhase2(circuit, {
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

// テーブルカラム定義とソート
const columns: TableColumn<CircuitItem>[] = [
  { key: 'banMeisho', label: '盤情報', sortable: true, width: '95px' },
  { key: 'kairoBangou', label: '回路番号', sortable: true, width: '80px', align: 'center' },
  { key: 'kairoMeisho', label: '回路名称', sortable: true, width: '135px' },
  { key: 'zetsuenR', label: '測定1', sortable: true, width: '100px', align: 'center' },
  { key: 'zetsuenS', label: '測定2', sortable: true, width: '100px', align: 'center' },
  { key: 'zetsuenT', label: '測定3', sortable: true, width: '100px', align: 'center' },
  { key: 'p2Remarks', label: '備考', sortable: true },
  { key: 'actions', label: '操作', width: '125px', align: 'center' },
  { key: 'p2ConfirmedAt', label: '測定者 / 日時', sortable: true, width: '110px', align: 'center' },
]

const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
  handleSort,
} = useTableSort(filteredCircuits)
</script>

<template>
  <div class="phase2">
    <AppSectionHeader
      title="フェーズ2：絶縁抵抗測定（メガ測定）"
      icon="activity"
      size="lg"
    >
      <template #actions>
        <SyncStatusBadge
          :site-id="siteId"
          @synced="fetchCircuits"
        />

        <AppButton
          variant="primary"
          size="sm"
          :loading="isBatchLoading"
          @click="batchConfirmPhase2(100)"
        >
          <AppIcon name="check-check" size="sm" />
          一括 100MΩ(OK) 確定
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
      <div class="phase2-controls">
        <div class="phase2-controls__filters">
          <!-- 盤種別タブ -->
          <div class="phase2-controls__row">
            <span class="phase2-controls__label">盤種別:</span>
            <AppTabs
              v-model="selectedBanShubetsu"
              :options="shubetsuTabOptions"
              variant="pills"
            />
          </div>

          <!-- 盤名称セレクト & 基準値表示 -->
          <div class="phase2-controls__row phase2-controls__row--inline">
            <div class="phase2-controls__select-group">
              <span class="phase2-controls__label">盤名称:</span>
              <AppSelect
                v-model="selectedBanMeisho"
                :options="availableBanMeishoList"
                class="phase2-controls__select"
              />
            </div>

            <!-- 基準値バッジ（数値のみ着色、単位はミュート） -->
            <div class="phase2-controls__threshold">
              <span class="phase2-controls__threshold-label">基準値: ≧</span>
              <span class="phase2-controls__threshold-val">{{ phase2ThresholdMegOhm.toFixed(1) }}</span>
              <span class="phase2-controls__threshold-unit">MΩ</span>
            </div>

            <AppBadge color="var(--theme-accent)">
              対象回路: {{ phaseStats.allCount }} 件
            </AppBadge>
          </div>
        </div>

        <!-- 全体進捗バー & ミニマップ -->
        <div class="phase2-controls__progress">
          <AppProgressBar
            label="フェーズ2 進捗状況"
            :completed="phaseStats.completed"
            :total="phaseStats.total"
            :excluded="phaseStats.excluded"
            :pct="phaseStats.pct"
            variant="success"
          />

          <!-- ミニマップ -->
          <ExamMinimap
            :circuits="sortedCircuits"
            :phase="2"
            @select-circuit="scrollToCircuit"
          />
        </div>
      </div>
    </AppPanel>

    <!-- 回路一覧テーブル -->
    <AppTable
      class="phase2__table"
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
            <div class="phase2-cell__panel">
              <span class="phase2-cell__ban-name">{{ circuit.banMeisho }}</span>
              <span class="phase2-cell__shubetsu">{{ circuit.banShubetsu }}</span>
            </div>
          </td>

          <!-- 回路番号 -->
          <td style="text-align: center;">
            <div class="phase2-cell__bangou-wrap">
              <span class="phase2-cell__type-badge" :class="{ 'is-three': isThreePhase(circuit) }">
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
            <span class="phase2-cell__meisho" :title="circuit.kairoMeisho || ''">
              {{ circuit.kairoMeisho || '-' }}
            </span>
          </td>

          <!-- 測定相 1 (R-S / R-N) -->
          <td style="text-align: center;">
            <template v-if="editingRowId === circuit.id">
              <div class="phase2-input-cell">
                <span class="phase2-input-cell__label">{{ getPhaseLabels(circuit).phase1 }}</span>
                <div class="phase2-input-cell__box">
                  <input
                    v-model="inputForm.rVal"
                    type="number"
                    step="0.1"
                    inputmode="decimal"
                    class="phase2-input"
                    placeholder="100"
                    @focus="handleInputFocus"
                    @keydown.enter.prevent="saveInput(circuit)"
                  >
                  <span class="phase2-input-cell__unit">MΩ</span>
                </div>
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
              <AppBadge
                v-if="circuit.p2RStatus"
                :color="circuit.p2RStatus === 'OK' ? 'var(--color-status-success)' : 'var(--color-status-danger)'"
              >
                {{ circuit.p2RStatus }}
              </AppBadge>
            </div>
          </td>

          <!-- 測定相 2 (S-T / T-N) -->
          <td style="text-align: center;">
            <template v-if="editingRowId === circuit.id">
              <div class="phase2-input-cell">
                <span class="phase2-input-cell__label">{{ getPhaseLabels(circuit).phase2 }}</span>
                <div class="phase2-input-cell__box">
                  <input
                    v-model="inputForm.sVal"
                    type="number"
                    step="0.1"
                    inputmode="decimal"
                    class="phase2-input"
                    placeholder="100"
                    @focus="handleInputFocus"
                    @keydown.enter.prevent="saveInput(circuit)"
                  >
                  <span class="phase2-input-cell__unit">MΩ</span>
                </div>
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
              <AppBadge
                v-if="circuit.p2SStatus"
                :color="circuit.p2SStatus === 'OK' ? 'var(--color-status-success)' : 'var(--color-status-danger)'"
              >
                {{ circuit.p2SStatus }}
              </AppBadge>
            </div>
          </td>

          <!-- 測定相 3 (R-T / R-T) -->
          <td style="text-align: center;">
            <template v-if="editingRowId === circuit.id">
              <div class="phase2-input-cell">
                <span class="phase2-input-cell__label">{{ getPhaseLabels(circuit).phase3 }}</span>
                <div class="phase2-input-cell__box">
                  <input
                    v-model="inputForm.tVal"
                    type="number"
                    step="0.1"
                    inputmode="decimal"
                    class="phase2-input"
                    placeholder="100"
                    @focus="handleInputFocus"
                    @keydown.enter.prevent="saveInput(circuit)"
                  >
                  <span class="phase2-input-cell__unit">MΩ</span>
                </div>
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
              <AppBadge
                v-if="circuit.p2TStatus"
                :color="circuit.p2TStatus === 'OK' ? 'var(--color-status-success)' : 'var(--color-status-danger)'"
              >
                {{ circuit.p2TStatus }}
              </AppBadge>
            </div>
          </td>

          <!-- 備考 -->
          <td>
            <template v-if="editingRowId === circuit.id">
              <AppInput v-model="inputForm.remarks" size="sm" placeholder="備考" />
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
                  @click="clearPhase2(circuit)"
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
                  @click="handleQuickOk(circuit)"
                >
                  全相OK
                </AppButton>
                <AppButton
                  variant="secondary"
                  size="sm"
                  :disabled="circuit.isExcluded"
                  @click="startInput(circuit)"
                >
                  測定入力
                </AppButton>
              </template>
            </div>
          </td>

          <!-- 測定者 / 日時 -->
          <td style="text-align: center;">
            <template v-if="circuit.p2Worker">
              <div class="phase2-cell__worker">
                <strong>{{ circuit.p2Worker }}</strong>
                <span class="phase2-cell__date">{{ formatShortDateTime(circuit.p2ConfirmedAt) }}</span>
              </div>
            </template>
            <span v-else class="phase2-cell__dash">-</span>
          </td>
        </tr>
      </template>
    </AppTable>
  </div>
</template>

<style scoped lang="scss">
.phase2 {
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap);
  height: 100%;

  &__table {
    flex: 1;
    min-height: 400px;
  }
}

.phase2-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-card-gap);
  align-items: flex-start;

  @include mq("lg") {
    grid-template-columns: 1fr;
  }

  &__filters {
    display: flex;
    flex-direction: column;
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

  &__threshold {
    display: flex;
    gap: 4px;
    align-items: center;

    padding: 2px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);

    font-size: var(--text-xs);

    background-color: rgb(255 255 255 / 4%);

    &-label {
      color: var(--color-text-muted);
    }

    &-val {
      font-family: var(--font-mono);
      font-weight: var(--font-weight-bold);
      color: var(--color-status-info, #38bdf8);
    }

    &-unit {
      color: var(--color-text-muted);
    }
  }

  &__progress {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
}

.phase2-row {
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

.phase2-cell {
  &__panel {
    overflow: hidden;
    display: flex;
    flex-direction: column;
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

  &__remarks {
    overflow: hidden;

    max-width: 140px;

    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__worker {
    display: flex;
    flex-direction: column;
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

.phase2-meas-cell {
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
    color: var(--color-text-secondary);

    &.is-ok {
      color: var(--color-status-success, #22c55e);
    }

    &.is-ng {
      color: var(--color-status-danger, #ef4444);
    }
  }

  &__unit {
    font-family: var(--font-sans);
    font-size: 10px;
    color: var(--color-text-muted);
  }
}

.phase2-input-cell {
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

.phase2-input {
  width: 58px;
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
  color: var(--color-status-warning, #f59e0b);

  &--strong {
    font-weight: var(--font-weight-bold, 700);
  }
}
</style>
