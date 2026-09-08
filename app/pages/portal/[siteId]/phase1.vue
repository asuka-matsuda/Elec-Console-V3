<script setup lang="ts">
/**
 * Phase 1 View
 * フェーズ1：回路確認・増し締め
 */
import { computed, onMounted, watch } from 'vue'

import { useHead, useRoute } from '#app'
import { usePhaseExam } from '~/composables/portal/usePhaseExam'
import { useTableSort } from '~/composables/useTableSort'
import { PHASE1_TABLE_COLUMNS } from '~/constants/soudenConstants'
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

// ソート管理
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
        <PortalSyncStatusBadge
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
    <PortalSoudenPhaseControls
      v-model:shubetsu="selectedBanShubetsu"
      v-model:ban-meisho="selectedBanMeisho"
      :shubetsu-options="shubetsuTabOptions"
      :ban-meisho-options="availableBanMeishoList"
      :stats="phaseStats"
      :circuits="sortedCircuits"
      :phase="1"
      @select-circuit="scrollToCircuit"
    />

    <!-- 回路一覧テーブル -->
    <AppTable
      class="phase1__table"
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
            <PortalSoudenWorkerCell
              :worker="circuit.p1Worker"
              :confirmed-at="circuit.p1ConfirmedAt"
            />
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
