<script setup lang="ts">
/**
 * Phase 2 View
 * フェーズ2：絶縁抵抗測定（メガ測定）
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { useHead, useRoute } from '#app'
import ExamMinimap from '~/components/Portal/ExamMinimap.vue'
import { usePhaseExam } from '~/composables/portal/usePhaseExam'
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
  hasIncompleteKansenWarning,
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

const isComplete = (c: CircuitItem) => {
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
</script>

<template>
  <div class="p-phase2">
    <AppSectionHeader
      title="フェーズ2：絶縁抵抗測定（メガ測定）"
      icon="activity"
      size="lg"
    >
      <template #actions>
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

    <!-- 安全性警告バナー（二次側で幹線未完了盤がある場合） -->
    <div v-if="hasIncompleteKansenWarning" class="p-phase2__warning">
      <AppIcon name="alert-triangle" size="md" />
      <div class="p-phase2__warning-content">
        <strong>【安全注意】幹線未完了の盤が含まれています</strong>
        <p>二次側の測定作業を開始する前に、該当する盤の幹線（一次側）試験（Phase 3まで）が完了していることを必ず確認してください。</p>
      </div>
    </div>

    <!-- 検索・絞り込み ＆ 進捗コントロールパネル -->
    <AppPanel variant="hud">
      <div class="p-phase2-controls">
        <div class="p-phase2-controls__filters">
          <!-- 系統選択 -->
          <div class="p-phase2-controls__row">
            <span class="p-phase2-controls__label">系統:</span>
            <div class="p-phase2-controls__pills">
              <button
                type="button"
                :class="['p-phase2-pill', { 'is-active': selectedKeiTo === '幹線' }]"
                @click="selectedKeiTo = '幹線'"
              >
                幹線
              </button>
              <button
                type="button"
                :class="['p-phase2-pill', { 'is-active': selectedKeiTo === '二次側' }]"
                @click="selectedKeiTo = '二次側'"
              >
                二次側
              </button>
              <button
                type="button"
                :class="['p-phase2-pill', { 'is-active': selectedKeiTo === 'ALL' }]"
                @click="selectedKeiTo = 'ALL'"
              >
                全系統
              </button>
            </div>
          </div>

          <!-- 盤種別タブ -->
          <div class="p-phase2-controls__row">
            <span class="p-phase2-controls__label">盤種別:</span>
            <AppTabs
              v-model="selectedBanShubetsu"
              :options="shubetsuTabOptions"
              variant="pills"
            />
          </div>

          <!-- 盤名称セレクト & 基準値表示 -->
          <div class="p-phase2-controls__row p-phase2-controls__row--inline">
            <div class="p-phase2-controls__select-group">
              <span class="p-phase2-controls__label">盤名称:</span>
              <AppSelect
                v-model="selectedBanMeisho"
                :options="availableBanMeishoList"
                class="p-phase2-controls__select"
              />
            </div>

            <!-- 基準値バッジ（数値のみ着色、単位はミュート） -->
            <div class="p-phase2-controls__threshold">
              <span class="p-phase2-controls__threshold-label">基準値: ≧</span>
              <span class="p-phase2-controls__threshold-val">{{ phase2ThresholdMegOhm.toFixed(1) }}</span>
              <span class="p-phase2-controls__threshold-unit">MΩ</span>
            </div>

            <AppBadge variant="info" size="sm">
              対象回路: {{ phaseStats.allCount }} 件
            </AppBadge>
          </div>
        </div>

        <!-- 全体進捗バー & ミニマップ -->
        <div class="p-phase2-controls__progress">
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
            :circuits="filteredCircuits"
            :phase="2"
            @select-circuit="scrollToCircuit"
          />
        </div>
      </div>
    </AppPanel>

    <!-- 回路一覧テーブル -->
    <div class="p-phase2__table-wrapper">
      <AppTable>
        <template #header>
          <tr>
            <th style="width: 110px;">
              盤情報
            </th>
            <th style="width: 140px;">
              回路番号 / 名称
            </th>
            <th style="width: 100px; text-align: center;">
              配電方式
            </th>
            <th style="width: 130px; text-align: center;">
              測定1
            </th>
            <th style="width: 130px; text-align: center;">
              測定2
            </th>
            <th style="width: 130px; text-align: center;">
              測定3
            </th>
            <th>備考</th>
            <th style="width: 150px; text-align: center;">
              操作
            </th>
            <th style="width: 120px; text-align: center;">
              測定者 / 日時
            </th>
          </tr>
        </template>

        <template #body>
          <tr
            v-for="circuit in filteredCircuits"
            :id="`row-${circuit.id}`"
            :key="circuit.id"
            :class="[
              'p-phase2-row',
              {
                'is-completed': isComplete(circuit),
                'is-excluded': circuit.isExcluded,
                'is-editing': editingRowId === circuit.id,
              },
            ]"
          >
            <!-- 盤種別 / 盤名称 -->
            <td>
              <div class="p-phase2-cell__panel">
                <span class="p-phase2-cell__ban-name">{{ circuit.banMeisho }}</span>
                <span class="p-phase2-cell__shubetsu">{{ circuit.banShubetsu }}</span>
              </div>
            </td>

            <!-- 回路番号 / 回路名称 -->
            <td>
              <div class="p-phase2-cell__circuit">
                <span class="p-phase2-cell__bangou">{{ circuit.kairoBangou || '-' }}</span>
                <span class="p-phase2-cell__meisho" :title="circuit.kairoMeisho || ''">
                  {{ circuit.kairoMeisho || '-' }}
                </span>
              </div>
            </td>

            <!-- 配電方式 / 相種別 -->
            <td style="text-align: center;">
              <span class="p-phase2-cell__type-badge" :class="{ 'is-three': isThreePhase(circuit) }">
                {{ getPhaseLabels(circuit).typeText }}
              </span>
            </td>

            <!-- 測定相 1 (R-S / R-N) -->
            <td style="text-align: center;">
              <template v-if="editingRowId === circuit.id">
                <div class="p-phase2-input-cell">
                  <span class="p-phase2-input-cell__label">{{ getPhaseLabels(circuit).phase1 }}</span>
                  <div class="p-phase2-input-cell__box">
                    <input
                      v-model="inputForm.rVal"
                      type="number"
                      step="0.1"
                      class="p-phase2-input"
                    >
                    <span class="p-phase2-input-cell__unit">MΩ</span>
                  </div>
                </div>
              </template>
              <div v-else class="p-phase2-meas-cell">
                <span class="p-phase2-meas-cell__label">{{ getPhaseLabels(circuit).phase1 }}</span>
                <div class="p-phase2-meas-cell__val-group">
                  <span
                    class="p-phase2-meas-cell__val"
                    :class="{
                      'is-ok': circuit.p2RStatus === 'OK' || (circuit.zetsuenR !== null && circuit.zetsuenR !== undefined && circuit.zetsuenR >= phase2ThresholdMegOhm),
                      'is-ng': circuit.p2RStatus === 'NG' || (circuit.zetsuenR !== null && circuit.zetsuenR !== undefined && circuit.zetsuenR < phase2ThresholdMegOhm),
                    }"
                  >
                    {{ formatMegValue(circuit.zetsuenR) }}
                  </span>
                  <span v-if="circuit.zetsuenR !== null && circuit.zetsuenR !== undefined" class="p-phase2-meas-cell__unit">MΩ</span>
                </div>
                <AppBadge
                  v-if="circuit.p2RStatus"
                  :variant="circuit.p2RStatus === 'OK' ? 'success' : 'danger'"
                  size="sm"
                >
                  {{ circuit.p2RStatus }}
                </AppBadge>
              </div>
            </td>

            <!-- 測定相 2 (S-T / T-N) -->
            <td style="text-align: center;">
              <template v-if="editingRowId === circuit.id">
                <div class="p-phase2-input-cell">
                  <span class="p-phase2-input-cell__label">{{ getPhaseLabels(circuit).phase2 }}</span>
                  <div class="p-phase2-input-cell__box">
                    <input
                      v-model="inputForm.sVal"
                      type="number"
                      step="0.1"
                      class="p-phase2-input"
                    >
                    <span class="p-phase2-input-cell__unit">MΩ</span>
                  </div>
                </div>
              </template>
              <div v-else class="p-phase2-meas-cell">
                <span class="p-phase2-meas-cell__label">{{ getPhaseLabels(circuit).phase2 }}</span>
                <div class="p-phase2-meas-cell__val-group">
                  <span
                    class="p-phase2-meas-cell__val"
                    :class="{
                      'is-ok': circuit.p2SStatus === 'OK' || (circuit.zetsuenS !== null && circuit.zetsuenS !== undefined && circuit.zetsuenS >= phase2ThresholdMegOhm),
                      'is-ng': circuit.p2SStatus === 'NG' || (circuit.zetsuenS !== null && circuit.zetsuenS !== undefined && circuit.zetsuenS < phase2ThresholdMegOhm),
                    }"
                  >
                    {{ formatMegValue(circuit.zetsuenS) }}
                  </span>
                  <span v-if="circuit.zetsuenS !== null && circuit.zetsuenS !== undefined" class="p-phase2-meas-cell__unit">MΩ</span>
                </div>
                <AppBadge
                  v-if="circuit.p2SStatus"
                  :variant="circuit.p2SStatus === 'OK' ? 'success' : 'danger'"
                  size="sm"
                >
                  {{ circuit.p2SStatus }}
                </AppBadge>
              </div>
            </td>

            <!-- 測定相 3 (R-T / R-T) -->
            <td style="text-align: center;">
              <template v-if="editingRowId === circuit.id">
                <div class="p-phase2-input-cell">
                  <span class="p-phase2-input-cell__label">{{ getPhaseLabels(circuit).phase3 }}</span>
                  <div class="p-phase2-input-cell__box">
                    <input
                      v-model="inputForm.tVal"
                      type="number"
                      step="0.1"
                      class="p-phase2-input"
                    >
                    <span class="p-phase2-input-cell__unit">MΩ</span>
                  </div>
                </div>
              </template>
              <div v-else class="p-phase2-meas-cell">
                <span class="p-phase2-meas-cell__label">{{ getPhaseLabels(circuit).phase3 }}</span>
                <div class="p-phase2-meas-cell__val-group">
                  <span
                    class="p-phase2-meas-cell__val"
                    :class="{
                      'is-ok': circuit.p2TStatus === 'OK' || (circuit.zetsuenT !== null && circuit.zetsuenT !== undefined && circuit.zetsuenT >= phase2ThresholdMegOhm),
                      'is-ng': circuit.p2TStatus === 'NG' || (circuit.zetsuenT !== null && circuit.zetsuenT !== undefined && circuit.zetsuenT < phase2ThresholdMegOhm),
                    }"
                  >
                    {{ formatMegValue(circuit.zetsuenT) }}
                  </span>
                  <span v-if="circuit.zetsuenT !== null && circuit.zetsuenT !== undefined" class="p-phase2-meas-cell__unit">MΩ</span>
                </div>
                <AppBadge
                  v-if="circuit.p2TStatus"
                  :variant="circuit.p2TStatus === 'OK' ? 'success' : 'danger'"
                  size="sm"
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
              <span v-else class="p-phase2-cell__remarks" :title="circuit.p2Remarks || ''">
                {{ circuit.p2Remarks || '-' }}
              </span>
            </td>

            <!-- 操作 -->
            <td style="text-align: center;">
              <div class="p-phase2-actions">
                <!-- 手入力編集モード中 -->
                <template v-if="editingRowId === circuit.id">
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
                <div class="p-phase2-cell__worker">
                  <strong>{{ circuit.p2Worker }}</strong>
                  <span class="p-phase2-cell__date">{{ formatDate(circuit.p2ConfirmedAt) }}</span>
                </div>
              </template>
              <span v-else class="p-phase2-cell__dash">-</span>
            </td>
          </tr>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-phase2 {
  @include flex-start-stretch($direction: column);

  gap: var(--space-section-gap);
  height: 100%;

  &__warning {
    display: flex;
    gap: var(--space-3);
    align-items: center;

    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-status-danger);
    border-radius: var(--radius-md);

    color: var(--color-status-danger);

    background-color: rgb(239 68 68 / 12%);

    &-content {
      p {
        margin: var(--space-1) 0 0;
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
      }
    }
  }

  &__table-wrapper {
    flex: 1;
    min-height: 400px;
  }
}

.p-phase2-controls {
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

  &__pills {
    display: flex;
    gap: var(--space-2);
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
    @include flex-start-stretch($direction: column);

    gap: var(--space-3);
  }
}

.p-phase2-pill {
  cursor: pointer;

  padding: var(--space-1) var(--space-3);
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: var(--radius-full);

  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);

  background-color: rgb(255 255 255 / 5%);

  transition: all 0.2s ease;

  &:hover {
    color: var(--color-text-main);
    background-color: rgb(255 255 255 / 10%);
  }

  &.is-active {
    border-color: var(--color-category-main, #3b82f6);
    color: #fff;
    background-color: var(--color-category-main, #3b82f6);
    box-shadow: 0 0 8px rgb(59 130 246 / 40%);
  }
}

.p-phase2-row {
  transition: background-color 0.2s ease;

  &.is-completed {
    background-color: rgb(34 197 94 / 5%);
  }

  &.is-excluded {
    opacity: 0.5;
  }

  &.is-highlighted {
    background-color: rgb(59 130 246 / 25%) !important;
    outline: 2px solid #3b82f6;
  }
}

.p-phase2-cell {
  &__panel {
    @include flex-start-stretch($direction: column);

    gap: 2px;
  }

  &__ban-name {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  &__shubetsu {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  &__circuit {
    @include flex-start-stretch($direction: column);

    gap: 2px;
  }

  &__bangou {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  &__meisho {
    overflow: hidden;

    max-width: 150px;

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

.p-phase2-meas-cell {
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

.p-phase2-input-cell {
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

.p-phase2-input {
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

.p-phase2-actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
}
</style>
