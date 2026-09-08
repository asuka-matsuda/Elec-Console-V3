<script setup lang="ts">
/**
 * Phase 1 View
 * フェーズ1：回路確認・増し締め
 */
import { computed, onMounted, watch } from 'vue'

import { useHead, useRoute } from '#app'
import ExamMinimap from '~/components/Portal/ExamMinimap.vue'
import { usePhaseExam } from '~/composables/portal/usePhaseExam'
import { useTableSort } from '~/composables/useTableSort'
import type { TableColumn } from '~/types/components'
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
  isCircuitLocked,
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

// テーブルカラム定義とソート
const columns: TableColumn<CircuitItem>[] = [
  { key: 'banMeisho', label: '盤情報', sortable: true, width: '95px' },
  { key: 'kairoBangou', label: '回路番号', sortable: true, width: '80px', align: 'center' },
  { key: 'kairoMeisho', label: '回路名称', sortable: true, width: '135px' },
  { key: 'cableList', label: '配線 / 接地', sortable: true, width: '130px' },
  { key: 'p1Kakunin', label: '確認 / 増締め', sortable: true, width: '115px', align: 'center' },
  { key: 'p1Remarks', label: '備考', sortable: true },
  { key: 'actions', label: '操作', width: '125px', align: 'center' },
  { key: 'p1ConfirmedAt', label: '測定者 / 日時', sortable: true, width: '115px', align: 'center' },
]

const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
  handleSort,
} = useTableSort(filteredCircuits)
</script>

<template>
  <div class="phase1">
    <AppSectionHeader
      title="フェーズ1：回路確認・増し締め"
      icon="check-square"
      size="lg"
    >
      <template #actions>
        <SyncStatusBadge
          :site-id="siteId"
          @synced="fetchCircuits"
        />
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
      <div class="phase1-controls">
        <div class="phase1-controls__filters">
          <!-- 盤種別タブ -->
          <div class="phase1-controls__row">
            <span class="phase1-controls__label">盤種別:</span>
            <AppTabs
              v-model="selectedBanShubetsu"
              :options="shubetsuTabOptions"
              variant="pills"
            />
          </div>

          <!-- 盤名称セレクト & 件数表示 -->
          <div class="phase1-controls__row phase1-controls__row--inline">
            <div class="phase1-controls__select-group">
              <span class="phase1-controls__label">盤名称:</span>
              <AppSelect
                v-model="selectedBanMeisho"
                :options="availableBanMeishoList"
                class="phase1-controls__select"
              />
            </div>

            <AppBadge color="var(--theme-accent)">
              対象回路: {{ phaseStats.allCount }} 件
            </AppBadge>
          </div>
        </div>

        <!-- 全体進捗バー -->
        <div class="phase1-controls__progress">
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
            :circuits="sortedCircuits"
            :phase="1"
            @select-circuit="scrollToCircuit"
          />
        </div>
      </div>
    </AppPanel>

    <!-- 回路一覧テーブル -->
    <AppTable
      class="phase1__table"
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
            <div class="phase1-cell__panel">
              <span class="phase1-cell__ban-name">{{ circuit.banMeisho }}</span>
              <span class="phase1-cell__shubetsu">{{ circuit.banShubetsu }}</span>
            </div>
          </td>

          <!-- 回路番号 -->
          <td style="text-align: center;">
            <template v-if="editingRowId === circuit.id">
              <AppInput v-model="editForm.kairoBangou" size="sm" placeholder="番号" />
            </template>
            <div v-else class="phase1-cell__bangou-wrap">
              <AppKairoIcon
                :kigou="circuit.kairoKigou"
                :bangou="circuit.kairoBangou"
              />
            </div>
          </td>

          <!-- 回路名称 -->
          <td>
            <template v-if="editingRowId === circuit.id">
              <AppInput v-model="editForm.kairoMeisho" size="sm" placeholder="回路名称" />
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
                  <AppInput v-model="editForm.cableList" size="sm" placeholder="ケーブル" />
                  <AppInput v-model="editForm.haisenJousuu" size="sm" placeholder="条数" style="width: 55px;" />
                </div>
                <AppInput v-model="editForm.setsuchiList" size="sm" placeholder="接地リスト" />
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
                <AppCheckbox
                  v-model="circuit.p1Kakunin"
                  :disabled="isComplete(circuit) || editingRowId === circuit.id || circuit.isExcluded || isCircuitLocked(circuit)"
                />
                <span class="phase1-check-item__label">確認</span>
              </label>
              <label class="phase1-check-item" title="増締め確認">
                <AppCheckbox
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
              <AppInput v-model="editForm.remarks" size="sm" placeholder="備考" />
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
              <div class="phase1-cell__worker">
                <strong>{{ circuit.p1Worker }}</strong>
                <span class="phase1-cell__date">{{ formatShortDateTime(circuit.p1ConfirmedAt) }}</span>
              </div>
            </template>
            <span v-else class="phase1-cell__dash">-</span>
          </td>
        </tr>
      </template>
    </AppTable>
  </div>
</template>

<style scoped lang="scss">
.phase1 {
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap);
  height: 100%;

  &__table {
    flex: 1;
    min-height: 400px;
  }
}

.phase1-controls {
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

  &__progress {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
}

.phase1-row {
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

.phase1-cell {
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
    color: var(--color-text-muted);
  }

  &__setsuchi {
    overflow: hidden;

    max-width: 140px;

    font-size: 11px;
    color: var(--color-text-muted);
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
  color: var(--color-status-warning, #f59e0b);

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
