<script setup lang="ts">
/**
 * ToolCableTableInput
 * ケーブルの種類、サイズ、本数を表形式（テーブル型）でコンパクトに入力・管理するコンポーネント。
 * PC・モバイルともに横スクロールなしで1行完結の高密度レイアウトを提供し、
 * ケーブルラック選定（外径表示）および配管サイズ自動選定（断面積表示）で共通利用されます。
 */
import { computed } from 'vue'

import type { CableInputItem } from '~/types/tools'
import {
  findCableByIndexString,
  getAvailableSizes,
  getCableCategories,
  getEffectiveCableDiameter,
} from '~/utils/cable'
import { calculateCableArea } from '~/utils/tools/conduit/conduitCalcLogic'

const props = withDefaults(
  defineProps<{
    modelValue: CableInputItem[]
    filter?: 'strong' | 'weak' | readonly string[] | string[]
    specType?: 'diameter' | 'area'
    addLabel?: string
  }>(),
  {
    filter: undefined,
    specType: 'diameter',
    addLabel: 'ケーブルを追加',
  },
)

const emit = defineEmits<{
  'update:modelValue': [items: CableInputItem[]]
  'add': []
  'remove': [id: string]
}>()

const categories = computed(() => getCableCategories(props.filter))

// 行ごとのサイズ選択肢マップ
const getSizesForCategory = (category: string) => {
  return getAvailableSizes(category)
}

// 行ごとのスペック表示値（外径または断面積）
const getSpecText = (cableIdx: string): string => {
  const def = findCableByIndexString(cableIdx)

  if (!def) return '---'

  const diameter = getEffectiveCableDiameter(def.diameter)

  if (diameter <= 0) return '---'

  if (props.specType === 'area') {
    const area = calculateCableArea(diameter)

    return `${area.toFixed(1)} mm²`
  }

  return `φ${diameter.toFixed(1)} mm`
}

const handleCategoryChange = (index: number, val: unknown) => {
  const updated = [...props.modelValue]
  const target = updated[index]

  if (!target) return

  updated[index] = {
    ...target,
    category: String(val ?? ''),
    cableIdx: '',
  }
  emit('update:modelValue', updated)
}

const handleSizeChange = (index: number, val: unknown) => {
  const updated = [...props.modelValue]
  const target = updated[index]

  if (!target) return

  updated[index] = {
    ...target,
    cableIdx: String(val ?? ''),
  }
  emit('update:modelValue', updated)
}

const handleCountChange = (index: number, val: unknown) => {
  const updated = [...props.modelValue]
  const target = updated[index]

  if (!target) return

  const num = typeof val === 'number' ? val : Number(val)

  updated[index] = {
    ...target,
    count: Number.isFinite(num) && num > 0 ? num : 1,
  }
  emit('update:modelValue', updated)
}
</script>

<template>
  <div class="c-cable-table">
    <!-- デスクトップヘッダー -->
    <div class="c-cable-table__header">
      <span class="c-cable-table__th c-cable-table__th--no">No.</span>
      <span class="c-cable-table__th c-cable-table__th--type">ケーブル種別</span>
      <span class="c-cable-table__th c-cable-table__th--size">サイズ</span>
      <span class="c-cable-table__th c-cable-table__th--count">本数</span>
      <span class="c-cable-table__th c-cable-table__th--spec">
        {{ specType === 'area' ? '参考断面積' : '参考外径' }}
      </span>
      <span class="c-cable-table__th c-cable-table__th--action" />
    </div>

    <!-- ケーブル行リスト -->
    <div class="c-cable-table__body">
      <div
        v-for="(cable, index) in modelValue"
        :key="cable.id"
        class="c-cable-table__row"
      >
        <!-- No. -->
        <div class="c-cable-table__cell c-cable-table__cell--no">
          <span class="c-cable-table__no-badge">{{ index + 1 }}</span>
        </div>

        <!-- ケーブル種別 -->
        <div class="c-cable-table__cell c-cable-table__cell--type">
          <AppSelect
            :model-value="cable.category"
            :options="categories"
            placeholder="選択"
            size="sm"
            @update:model-value="(val) => handleCategoryChange(index, val)"
          />
        </div>

        <!-- ケーブルサイズ -->
        <div class="c-cable-table__cell c-cable-table__cell--size">
          <AppSelect
            :model-value="cable.cableIdx"
            :options="getSizesForCategory(cable.category)"
            placeholder="選択"
            size="sm"
            :disabled="!cable.category"
            @update:model-value="(val) => handleSizeChange(index, val)"
          />
          <!-- モバイル時のみサイズの下に極小スペックを表示 -->
          <span
            v-if="cable.cableIdx"
            class="c-cable-table__spec-mobile"
          >
            {{ getSpecText(cable.cableIdx) }}
          </span>
        </div>

        <!-- 本数 -->
        <div class="c-cable-table__cell c-cable-table__cell--count">
          <AppInputGroup size="sm">
            <AppInput
              :model-value="cable.count"
              type="number"
              min="1"
              size="sm"
              @update:model-value="(val) => handleCountChange(index, val)"
            />
            <template #append>
              <span class="c-input-addon">本</span>
            </template>
          </AppInputGroup>
        </div>

        <!-- デスクトップ参考スペック -->
        <div class="c-cable-table__cell c-cable-table__cell--spec">
          <span class="c-cable-table__spec-desktop">
            {{ getSpecText(cable.cableIdx) }}
          </span>
        </div>

        <!-- 行削除ボタン -->
        <div class="c-cable-table__cell c-cable-table__cell--action">
          <AppButton
            variant="danger"
            size="sm"
            icon-only
            :disabled="modelValue.length <= 1"
            class="c-cable-table__remove-btn"
            aria-label="行を削除"
            @click="emit('remove', cable.id)"
          >
            <AppIcon name="trash-2" size="sm" />
          </AppButton>
        </div>
      </div>
    </div>

    <!-- 追加ボタン -->
    <div class="c-cable-table__footer">
      <AppButton
        variant="secondary"
        size="sm"
        @click="emit('add')"
      >
        <AppIcon name="plus" size="sm" />
        <span>{{ addLabel }}</span>
      </AppButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-cable-table {
  display: flex;
  flex-direction: column;
  gap: var(--space-item-gap);
  width: 100%;

  // ヘッダー行（デスクトップ）
  &__header {
    display: grid;
    grid-template-columns: 24px minmax(0, 1.1fr) minmax(0, 1.4fr) 72px 64px 28px;
    align-items: center;
    gap: var(--space-1-5, 6px);
    padding: var(--space-1) var(--space-1-5, 6px);
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);

    @include mq("sm") {
      display: none;
    }
  }

  &__th {
    white-space: nowrap;

    &--no {
      text-align: center;
    }

    &--count {
      text-align: center;
    }

    &--spec {
      text-align: right;
    }
  }

  // ボディ行リスト
  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-item-gap);
  }

  // テーブル行（1行完結）
  &__row {
    display: grid;
    grid-template-columns: 24px minmax(0, 1.1fr) minmax(0, 1.4fr) 72px 64px 28px;
    align-items: center;
    gap: var(--space-1-5, 6px);
    padding: var(--space-1) var(--space-1-5, 6px);
    background: var(--surface-bg-elevated);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    transition: border-color 0.15s ease, background-color 0.15s ease;

    &:hover {
      border-color: var(--color-border);
    }

    // スマホ時：横スクロールなしで1行に凝縮
    @include mq("sm") {
      grid-template-columns: 20px minmax(0, 1.1fr) minmax(0, 1.3fr) 68px 26px;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-1);
    }
  }

  &__cell {
    min-width: 0;

    &--no {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    &--size {
      display: flex;
      flex-direction: column;
      gap: var(--space-0-5, 2px);
    }

    &--count {
      :deep(.c-form-control) {
        padding-inline: var(--space-1);
        text-align: center;
      }

      :deep(.c-input-addon) {
        padding-inline: var(--space-1);
        font-size: var(--font-size-2xs);
      }
    }

    &--spec {
      text-align: right;

      @include mq("sm") {
        display: none;
      }
    }

    &--action {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    // セレクトボックスのパディングをコンパクトに最適化
    :deep(.c-custom-select__value) {
      padding-inline: var(--space-1-5, 6px);
    }

    :deep(.c-custom-select__text) {
      font-size: var(--font-size-xs);
    }
  }

  // No. バッジ
  &__no-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: var(--radius-full, 9999px);
    background: var(--surface-bg);
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    border: 1px solid var(--color-border-subtle);

    @include mq("sm") {
      width: 18px;
      height: 18px;
      font-size: var(--font-size-2xs);
    }
  }

  // 参考値（デスクトップ）
  &__spec-desktop {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    font-family: var(--font-mono);
    white-space: nowrap;
  }

  // 参考値（モバイル：サイズの下に極小付記）
  &__spec-mobile {
    overflow: hidden;
    display: none;

    padding-left: var(--space-1);

    font-family: var(--font-mono);
    font-size: var(--font-size-2xs);
    line-height: var(--line-height-tight);
    color: var(--color-text-muted);
    text-overflow: ellipsis;
    white-space: nowrap;

    @include mq("sm") {
      display: block;
    }
  }

  // 削除ボタン
  &__remove-btn {
    flex-shrink: 0;
  }

  // フッター（追加ボタン）
  &__footer {
    display: flex;
    justify-content: flex-start;
    padding-top: var(--space-1);
  }
}
</style>
