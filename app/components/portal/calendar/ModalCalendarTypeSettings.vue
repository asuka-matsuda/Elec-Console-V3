<script setup lang="ts">
/**
 * ModalCalendarTypeSettings
 * [Organisms] カレンダーの予定種別とテーマカラーを設定するモーダルコンポーネント。
 * Geist コンソール調の直角デザイン・実物イベントバッジプレビューに対応。
 */
import { ref, toRef } from 'vue'

import type { EventType } from '#shared/types/calendar'
import { useCalendarTypeSettings } from '~/composables/portal/useCalendarTypeSettings'
import { DEFAULT_COLOR_PRESETS } from '~/constants/colors'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  eventTypes: EventType[]
}>()

const emit = defineEmits<{
  (e: 'save', types: EventType[]): void
}>()

const {
  types,
  handleAddType: baseAddType,
  handleRemoveType,
  handleSave,
} = useCalendarTypeSettings({
  eventTypes: toRef(props, 'eventTypes'),
  isOpen,
  onSave: types => emit('save', types),
})

// 展開中のカラーパレットの種別ID
const activePaletteId = ref<string | null>(null)

const togglePalette = (id: string) => {
  activePaletteId.value = activePaletteId.value === id ? null : id
}

const handleAddType = () => {
  baseAddType()

  // 追加した最新種別のカラーパレットを自動展開
  const last = types.value[types.value.length - 1]

  if (last) {
    activePaletteId.value = last.id
  }
}

const selectColor = (type: EventType, color: string) => {
  type.color = color
}

const getColorName = (colorHex?: string) => {
  if (!colorHex) return ''

  const found = DEFAULT_COLOR_PRESETS.find(p => p.value.toLowerCase() === colorHex.toLowerCase())

  return found ? found.name : colorHex
}
</script>

<template>
  <Modal v-model="isOpen" title="予定種別の設定" size="lg">
    <div class="flex flex-col gap-panel-gap w-full md:min-w-[500px]">
      <div class="flex items-center justify-between">
        <p class="guide-text">
          カレンダーに表示する予定種別とテーマカラーを設定します。
        </p>
        <span class="count-badge">全 {{ types.length }} 件</span>
      </div>

      <ul class="flex flex-col gap-item-gap max-h-[440px] overflow-y-auto pr-inline-gap">
        <li
          v-for="(t, index) in types"
          :key="t.id"
          class="type-item flex flex-col"
          :class="{ 'is-palette-open': activePaletteId === t.id }"
          :style="{ '--item-color': t.color }"
        >
          <!-- コントロール行 -->
          <div class="flex flex-col gap-inline-gap w-full p-item-gap">
            <div class="flex items-center gap-item-gap w-full">
              <!-- カラートリガーボタン（Geist調の直角ピル） -->
              <button
                type="button"
                class="color-trigger-btn flex items-center gap-inline-gap shrink-0"
                :class="{ 'is-active': activePaletteId === t.id }"
                title="カラーパレットを開閉"
                @click="togglePalette(t.id)"
              >
                <span class="color-chip" :style="{ backgroundColor: t.color }" />
                <Icon
                  name="chevron-down"
                  class="trigger-icon"
                  :class="{ 'is-rotated': activePaletteId === t.id }"
                />
              </button>

              <!-- 種別名入力 -->
              <Input
                v-model="t.name"
                class="flex-1 min-w-0"
                placeholder="種別名（例: 現場作業）"
                required
              />

              <!-- カレンダー実物バッジプレビュー（デスクトップ） -->
              <div
                class="preview-badge shrink-0 hidden sm:flex items-center gap-inline-gap"
                :style="{ '--badge-color': t.color }"
                title="カレンダー上の表示プレビュー（クリックでカラー選択）"
                @click="togglePalette(t.id)"
              >
                <span class="shrink-0 preview-time">09:00</span>
                <span class="preview-name">{{ t.name.trim() || '種別名' }}</span>
              </div>

              <!-- 削除ボタン -->
              <Button
                v-if="types.length > 1"
                variant="danger"
                size="sm"
                icon="trash-2"
                class="shrink-0"
                @click="handleRemoveType(index)"
              />
            </div>

            <!-- モバイル表示時のインラインプレビュー -->
            <div class="flex sm:hidden items-center justify-between gap-inline-gap">
              <span class="preview-caption">プレビュー</span>
              <div
                class="preview-badge flex items-center gap-inline-gap"
                :style="{ '--badge-color': t.color }"
                title="カレンダー上の表示プレビュー（クリックでカラー選択）"
                @click="togglePalette(t.id)"
              >
                <span class="shrink-0 preview-time">09:00</span>
                <span class="preview-name">{{ t.name.trim() || '種別名' }}</span>
              </div>
            </div>
          </div>

          <!-- 展開型カラーパレットトレイ（Geistコンソール調） -->
          <div v-if="activePaletteId === t.id" class="palette-drawer p-item-gap">
            <div class="flex items-center justify-between pb-inline-gap">
              <span class="palette-caption">プリセットカラー</span>
              <span class="palette-color-name">{{ getColorName(t.color) }}</span>
            </div>

            <div class="flex flex-wrap gap-inline-gap palette-grid">
              <Tooltip
                v-for="preset in DEFAULT_COLOR_PRESETS"
                :key="preset.value"
                :text="preset.name"
              >
                <button
                  type="button"
                  class="flex items-center justify-center palette-slot"
                  :class="{ 'is-active': t.color === preset.value }"
                  :style="{ '--slot-color': preset.value }"
                  @click="selectColor(t, preset.value)"
                >
                  <span class="slot-dot" :style="{ backgroundColor: preset.value }" />
                  <Icon
                    v-if="t.color === preset.value"
                    name="check"
                    class="slot-check"
                  />
                </button>
              </Tooltip>
            </div>
          </div>
        </li>
      </ul>

      <div>
        <Button size="sm" icon="plus" @click="handleAddType">種別を追加する</Button>
      </div>
    </div>

    <template #actions>
      <Button @click="isOpen = false">キャンセル</Button>
      <Button variant="primary" icon="check" @click="handleSave">設定を保存する</Button>
    </template>
  </Modal>
</template>

<style scoped lang="scss">
.guide-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.count-badge {
  padding: var(--space-0-5) var(--space-1-5);
  border: var(--border-width-base) solid var(--color-border);

  font-family: var(--font-mono);
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);

  background: var(--surface-bg-elevated);
}

.type-item {
  border: var(--border-width-base) solid var(--color-border);
  border-left: 4px solid var(--item-color, var(--color-border));
  background: var(--surface-bg-elevated);
  transition: var(--transition-panel);

  &:hover {
    border-color: color-mix(in srgb, var(--item-color, var(--color-border)) 40%, var(--color-border));
  }

  &.is-palette-open {
    border-color: color-mix(in srgb, var(--item-color, var(--color-border)) 60%, var(--color-border));
  }
}

.color-trigger-btn {
  height: 40px;
  padding: 0 var(--space-2);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: 0;

  color: var(--color-text-main);

  background: var(--surface-bg);

  transition: var(--transition-interactive);

  @include state-interactive;

  &:hover,
  &.is-active {
    border-color: var(--item-color, var(--theme-accent));
    background: color-mix(in srgb, var(--item-color, var(--theme-accent)) 10%, var(--surface-bg));
  }

  .trigger-icon {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    transition: transform var(--duration-fast) var(--ease-base);

    &.is-rotated {
      transform: rotate(180deg);
    }
  }
}

.color-chip {
  width: 14px;
  height: 14px;
  border: 1px solid color-mix(in srgb, black 20%, transparent);
  border-radius: var(--radius-circle);
}

.preview-caption {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}

.preview-badge {
  user-select: none;

  max-width: 180px;
  padding: var(--space-1) var(--space-2);
  border: var(--border-width-base) solid var(--badge-color, var(--theme-accent));
  border-radius: 0;

  font-size: var(--font-size-xs);

  background: color-mix(in srgb, var(--badge-color, var(--theme-accent)) 12%, var(--surface-bg-elevated));

  transition: var(--transition-interactive);

  @include state-interactive;

  &:hover {
    background: color-mix(in srgb, var(--badge-color, var(--theme-accent)) 22%, var(--surface-bg-elevated));
  }

  .preview-time {
    font-family: var(--font-mono);
    font-size: var(--font-size-2xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
  }

  .preview-name {
    overflow: hidden;

    font-weight: var(--font-weight-medium);
    color: var(--color-text-main);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.palette-drawer {
  border-top: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 60%, transparent);
  background: color-mix(in srgb, var(--color-bg) 50%, var(--surface-bg-elevated));

  .palette-caption {
    font-family: var(--font-mono);
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
    letter-spacing: var(--tracking-wide);
  }

  .palette-color-name {
    font-family: var(--font-mono);
    font-size: var(--font-size-2xs);
    color: var(--color-text-secondary);
  }
}

.palette-slot {
  position: relative;

  width: 28px;
  height: 28px;
  padding: 0;
  border: var(--border-width-base) solid var(--color-border);
  border-radius: 0;

  background: var(--surface-bg);

  transition: var(--transition-interactive);

  @include state-interactive;

  &:hover {
    transform: translateY(-1px);
    border-color: var(--slot-color);
  }

  &.is-active {
    border-color: var(--slot-color);
    background: color-mix(in srgb, var(--slot-color) 20%, var(--surface-bg));
    outline: 1px solid var(--slot-color);
    outline-offset: 1px;
  }

  .slot-dot {
    width: 12px;
    height: 12px;
    border: 1px solid color-mix(in srgb, black 20%, transparent);
    border-radius: var(--radius-circle);
  }

  .slot-check {
    position: absolute;
    font-size: var(--font-size-2xs);
    color: white;
    filter: drop-shadow(0 0 2px black);
  }
}
</style>
