<script setup lang="ts">
/**
 * Phase 1 View
 * フェーズ1：回路確認・増し締め
 */
import { computed, onMounted, watch } from 'vue'

import { useHead, useRoute } from '#app'
import ExamMinimap from '~/components/Portal/ExamMinimap.vue'
import { usePhaseExam } from '~/composables/portal/usePhaseExam'
import type { CircuitItem } from '~/types/souden'

useHead({ title: 'フェーズ1：回路確認・増し締め - Elec-Console' })

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
  hasIncompleteKansenWarning,
  editingRowId,
  editForm,
  isActionLoading,
  fetchCircuits,
  startEdit,
  cancelEdit,
  saveEdit,
  confirmPhase1,
  clearPhase1,
} = usePhaseExam(siteId, initialKeiTo.value)

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
  return Boolean(c.p1ConfirmedAt && c.p1Kakunin && c.p1Mashishime)
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
</script>

<template>
  <div class="p-phase1">
    <AppSectionHeader
      title="フェーズ1：回路確認・増し締め"
      icon="check-square"
      size="lg"
    >
      <template #actions>
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
    <div v-if="hasIncompleteKansenWarning" class="p-phase1__warning">
      <AppIcon name="alert-triangle" size="md" />
      <div class="p-phase1__warning-content">
        <strong>【安全注意】幹線未完了の盤が含まれています</strong>
        <p>二次側の作業を開始する前に、該当する盤の幹線（一次側）試験（Phase 3まで）が完了していることを必ず確認してください。</p>
      </div>
    </div>

    <!-- 検索・絞り込み ＆ 進捗コントロールパネル -->
    <AppPanel variant="hud">
      <div class="p-phase1-controls">
        <div class="p-phase1-controls__filters">
          <!-- 系統選択 -->
          <div class="p-phase1-controls__row">
            <span class="p-phase1-controls__label">系統:</span>
            <div class="p-phase1-controls__pills">
              <button
                type="button"
                :class="['p-phase1-pill', { 'is-active': selectedKeiTo === '幹線' }]"
                @click="selectedKeiTo = '幹線'"
              >
                幹線
              </button>
              <button
                type="button"
                :class="['p-phase1-pill', { 'is-active': selectedKeiTo === '二次側' }]"
                @click="selectedKeiTo = '二次側'"
              >
                二次側
              </button>
              <button
                type="button"
                :class="['p-phase1-pill', { 'is-active': selectedKeiTo === 'ALL' }]"
                @click="selectedKeiTo = 'ALL'"
              >
                全系統
              </button>
            </div>
          </div>

          <!-- 盤種別タブ -->
          <div class="p-phase1-controls__row">
            <span class="p-phase1-controls__label">盤種別:</span>
            <AppTabs
              v-model="selectedBanShubetsu"
              :options="shubetsuTabOptions"
              variant="pills"
            />
          </div>

          <!-- 盤名称セレクト & 件数表示 -->
          <div class="p-phase1-controls__row p-phase1-controls__row--inline">
            <div class="p-phase1-controls__select-group">
              <span class="p-phase1-controls__label">盤名称:</span>
              <AppSelect
                v-model="selectedBanMeisho"
                :options="availableBanMeishoList"
                class="p-phase1-controls__select"
              />
            </div>

            <AppBadge variant="info" size="sm">
              対象回路: {{ phaseStats.allCount }} 件
            </AppBadge>
          </div>
        </div>

        <!-- 全体進捗バー -->
        <div class="p-phase1-controls__progress">
          <AppProgressBar
            label="フェーズ1 進捗状況"
            :completed="phaseStats.completed"
            :total="phaseStats.total"
            :excluded="phaseStats.excluded"
            :pct="phaseStats.pct"
            variant="success"
          />

          <!-- ミニマップ -->
          <ExamMinimap
            :circuits="filteredCircuits"
            :phase="1"
            @select-circuit="scrollToCircuit"
          />
        </div>
      </div>
    </AppPanel>

    <!-- 回路一覧テーブル -->
    <div class="p-phase1__table-wrapper">
      <AppTable>
        <template #header>
          <tr>
            <th style="width: 110px;">
              盤情報
            </th>
            <th style="width: 100px;">
              回路番号
            </th>
            <th>回路名称</th>
            <th style="width: 130px;">
              ケーブルリスト
            </th>
            <th style="width: 90px;">
              配線条数
            </th>
            <th style="width: 120px;">
              接地リスト
            </th>
            <th style="width: 70px; text-align: center;">
              確認
            </th>
            <th style="width: 70px; text-align: center;">
              増締め
            </th>
            <th>備考</th>
            <th style="width: 130px; text-align: center;">
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
              'p-phase1-row',
              {
                'is-completed': isComplete(circuit),
                'is-excluded': circuit.isExcluded,
                'is-editing': editingRowId === circuit.id,
              },
            ]"
          >
            <!-- 盤種別 / 盤名称 -->
            <td>
              <div class="p-phase1-cell__panel">
                <span class="p-phase1-cell__ban-name">{{ circuit.banMeisho }}</span>
                <span class="p-phase1-cell__shubetsu">{{ circuit.banShubetsu }}</span>
              </div>
            </td>

            <!-- 回路番号 -->
            <td>
              <template v-if="editingRowId === circuit.id">
                <AppInput v-model="editForm.kairoBangou" size="sm" />
              </template>
              <span v-else class="p-phase1-cell__text">{{ circuit.kairoBangou || '-' }}</span>
            </td>

            <!-- 回路名称 -->
            <td>
              <template v-if="editingRowId === circuit.id">
                <AppInput v-model="editForm.kairoMeisho" size="sm" />
              </template>
              <span v-else class="p-phase1-cell__text p-phase1-cell__meisho">
                {{ circuit.kairoMeisho || '-' }}
              </span>
            </td>

            <!-- ケーブルリスト -->
            <td>
              <template v-if="editingRowId === circuit.id">
                <AppInput v-model="editForm.cableList" size="sm" />
              </template>
              <span v-else class="p-phase1-cell__text">{{ circuit.cableList || '-' }}</span>
            </td>

            <!-- 配線条数 -->
            <td>
              <template v-if="editingRowId === circuit.id">
                <AppInput v-model="editForm.haisenJousuu" size="sm" />
              </template>
              <span v-else class="p-phase1-cell__text">{{ circuit.haisenJousuu || '-' }}</span>
            </td>

            <!-- 接地リスト -->
            <td>
              <template v-if="editingRowId === circuit.id">
                <AppInput v-model="editForm.setsuchiList" size="sm" />
              </template>
              <span v-else class="p-phase1-cell__text">{{ circuit.setsuchiList || '-' }}</span>
            </td>

            <!-- 確認 (チェックボックス) -->
            <td style="text-align: center;">
              <AppCheckbox
                v-model="circuit.p1Kakunin"
                :disabled="isComplete(circuit) || editingRowId === circuit.id || circuit.isExcluded"
              />
            </td>

            <!-- 増し締め (チェックボックス) -->
            <td style="text-align: center;">
              <AppCheckbox
                v-model="circuit.p1Mashishime"
                :disabled="isComplete(circuit) || editingRowId === circuit.id || circuit.isExcluded"
              />
            </td>

            <!-- 備考 -->
            <td>
              <template v-if="editingRowId === circuit.id">
                <AppInput v-model="editForm.remarks" size="sm" placeholder="備考" />
              </template>
              <span v-else class="p-phase1-cell__text p-phase1-cell__remarks">
                {{ circuit.p1Remarks || '-' }}
              </span>
            </td>

            <!-- 操作 -->
            <td style="text-align: center;">
              <div class="p-phase1-actions">
                <!-- 編集モード中 -->
                <template v-if="editingRowId === circuit.id">
                  <AppButton
                    variant="success"
                    size="sm"
                    :loading="isActionLoading[circuit.id]"
                    @click="saveEdit(circuit)"
                  >
                    保存
                  </AppButton>
                  <AppButton
                    variant="secondary"
                    size="sm"
                    @click="cancelEdit"
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
                    @click="clearPhase1(circuit)"
                  >
                    解除
                  </AppButton>
                </template>

                <!-- 通常モード：未確定 -->
                <template v-else>
                  <AppButton
                    variant="primary"
                    size="sm"
                    :disabled="!circuit.p1Kakunin || !circuit.p1Mashishime || circuit.isExcluded"
                    :loading="isActionLoading[circuit.id]"
                    @click="confirmPhase1(circuit)"
                  >
                    確定
                  </AppButton>
                  <AppButton
                    variant="secondary"
                    size="sm"
                    :disabled="circuit.isExcluded"
                    @click="startEdit(circuit)"
                  >
                    編集
                  </AppButton>
                </template>
              </div>
            </td>

            <!-- 測定者 / 日時 -->
            <td style="text-align: center;">
              <template v-if="circuit.p1Worker">
                <div class="p-phase1-cell__worker">
                  <strong>{{ circuit.p1Worker }}</strong>
                  <span class="p-phase1-cell__date">{{ formatDate(circuit.p1ConfirmedAt) }}</span>
                </div>
              </template>
              <span v-else class="p-phase1-cell__dash">-</span>
            </td>
          </tr>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-phase1 {
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

.p-phase1-controls {
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

  &__progress {
    @include flex-start-stretch($direction: column);

    gap: var(--space-3);
  }
}

.p-phase1-pill {
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

.p-phase1-row {
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

.p-phase1-cell {
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

  &__text {
    font-size: var(--text-xs);
    color: var(--color-text-main);
  }

  &__meisho {
    overflow: hidden;
    max-width: 220px;
    text-overflow: ellipsis;
  }

  &__remarks {
    overflow: hidden;
    max-width: 160px;
    text-overflow: ellipsis;
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

.p-phase1-actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
}
</style>
