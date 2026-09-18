<script setup lang="ts">
/**
 * PortalOrganismsCalTypeSettingsModal
 * [Organisms] カレンダーの予定種別とテーマカラーを設定するモーダルコンポーネント。
 */
import { toRef } from 'vue'

import type { EventType } from '~/composables/portal/useCalendar'
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
  handleAddType,
  handleRemoveType,
  handleSave,
} = useCalendarTypeSettings({
  eventTypes: toRef(props, 'eventTypes'),
  isOpen,
  onSave: types => emit('save', types),
})
</script>

<template>
  <Modal v-model="isOpen" title="予定種別の設定">
    <div class="flex flex-col gap-panel-gap">
      <p class="m-0 lead-text">
        カレンダーに表示する予定種別とテーマカラーを設定します。
      </p>

      <ul class="flex flex-col gap-2 max-h-[400px] overflow-y-auto m-0 pl-0 pr-1 list-none">
        <li v-for="(t, index) in types" :key="t.id" class="flex flex-col gap-2 p-2.5 type-item">
          <div class="flex items-center gap-2 w-full">
            <div
              class="w-6 h-6 shrink-0 color-preview"
              :style="{ '--preview-color': t.color }"
            />

            <div class="flex-1">
              <Input
                v-model="t.name"
                placeholder="種別名（例: 現場作業）"
                required
              />
            </div>

            <Button
              v-if="types.length > 1"
              variant="danger"
              icon="trash-2"
              class="shrink-0"
              @click="handleRemoveType(index)"
            />
          </div>

          <div class="flex flex-wrap items-center gap-1.5 pl-8">
            <button
              v-for="preset in DEFAULT_COLOR_PRESETS"
              :key="preset.value"
              type="button"
              class="w-5 h-5 color-dot"
              :class="{ 'is-active': t.color === preset.value }"
              :style="{ '--dot-color': preset.value }"
              :title="preset.name"
              @click="t.color = preset.value"
            />
          </div>
        </li>
      </ul>

      <div class="flex items-center">
        <Button
          icon="plus"
          @click="handleAddType"
        >
          種別を追加
        </Button>
      </div>
    </div>

    <template #actions>
      <Button @click="isOpen = false">
        キャンセル
      </Button>
      <Button variant="success" icon="check" @click="handleSave">
        設定を保存
      </Button>
    </template>
  </Modal>
</template>

<style scoped lang="scss">
.lead-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.type-item {
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 40%, transparent);
  background: var(--surface-bg-elevated);
}

.color-preview {
  border: 1px solid color-mix(in srgb, var(--preview-color, var(--theme-accent)) 60%, transparent);
  background: var(--preview-color, var(--theme-accent));
}

.color-dot {
  cursor: pointer;

  border: 1px solid color-mix(in srgb, black 15%, transparent);
  border-radius: var(--radius-circle);

  background: var(--dot-color);

  transition: var(--transition-interactive);

  @include state-control-interactive {
    &:hover {
      transform: scale(1.18);
    }
  }

  &.is-active {
    outline: 2px solid var(--color-text-main);
    outline-offset: 2px;
  }
}
</style>
