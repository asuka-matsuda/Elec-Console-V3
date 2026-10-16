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
        <small>カレンダーに表示する予定種別とテーマカラーを設定します。</small>
        <Badge size="sm" variant="gray">全 {{ types.length }} 件</Badge>
      </div>

      <ul class="flex flex-col gap-item-gap max-h-[440px] overflow-y-auto">
        <li
          v-for="(t, index) in types"
          :key="t.id"
          class="panel is-elevated p-panel-pad-compact flex flex-col gap-item-gap"
          :class="{ 'is-active': activePaletteId === t.id }"
          :style="{ '--theme-accent': t.color, '--glow-color': t.color }"
        >
          <div class="flex items-center gap-item-gap w-full">
            <button
              type="button"
              class="panel is-interactive p-panel-pad-compact flex items-center gap-inline-gap h-10 shrink-0"
              :class="{ 'is-active': activePaletteId === t.id }"
              title="カラーパレットを開閉"
              @click="togglePalette(t.id)"
            >
              <span class="w-3.5 h-3.5 shrink-0" :style="{ backgroundColor: t.color }" />
              <Icon name="chevron-down" size="sm" />
            </button>

            <Input
              v-model="t.name"
              class="flex-1 min-w-0"
              placeholder="種別名（例: 現場作業）"
              required
            />

            <button
              type="button"
              class="panel is-interactive p-panel-pad-compact shrink-0 hidden sm:flex items-center gap-inline-gap max-w-[180px]"
              :style="{ borderColor: t.color }"
              title="カレンダー上の表示プレビュー（クリックでカラー選択）"
              @click="togglePalette(t.id)"
            >
              <time class="shrink-0">09:00</time>
              <strong class="truncate">{{ t.name.trim() || '種別名' }}</strong>
            </button>

            <Button
              v-if="types.length > 1"
              variant="danger"
              size="sm"
              icon="trash-2"
              class="shrink-0"
              @click="handleRemoveType(index)"
            />
          </div>

          <div class="flex sm:hidden items-center justify-between gap-inline-gap">
            <small>プレビュー</small>
            <button
              type="button"
              class="panel is-interactive p-panel-pad-compact flex items-center gap-inline-gap max-w-[180px]"
              :style="{ borderColor: t.color }"
              title="カレンダー上の表示プレビュー（クリックでカラー選択）"
              @click="togglePalette(t.id)"
            >
              <time class="shrink-0">09:00</time>
              <strong class="truncate">{{ t.name.trim() || '種別名' }}</strong>
            </button>
          </div>

          <div v-if="activePaletteId === t.id" class="panel is-sunken p-panel-pad-compact flex flex-col gap-inline-gap">
            <div class="flex items-center justify-between">
              <small>プリセットカラー</small>
              <code>{{ getColorName(t.color) }}</code>
            </div>

            <div class="flex flex-wrap gap-inline-gap">
              <Tooltip
                v-for="preset in DEFAULT_COLOR_PRESETS"
                :key="preset.value"
                :text="preset.name"
              >
                <button
                  type="button"
                  class="panel is-interactive flex items-center justify-center w-7 h-7 p-0"
                  :class="{ 'is-active': t.color === preset.value }"
                  :style="{ borderColor: t.color === preset.value ? preset.value : undefined }"
                  @click="selectColor(t, preset.value)"
                >
                  <span class="w-3.5 h-3.5 flex items-center justify-center" :style="{ backgroundColor: preset.value }">
                    <Icon v-if="t.color === preset.value" name="check" size="sm" />
                  </span>
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

    <template #footer>
      <Button @click="isOpen = false">キャンセル</Button>
      <Button variant="primary" icon="check" @click="handleSave">設定を保存する</Button>
    </template>
  </Modal>
</template>
