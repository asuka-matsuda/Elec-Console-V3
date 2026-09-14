<script setup lang="ts">
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

const PRESET_COLORS = DEFAULT_COLOR_PRESETS.map(p => p.value)

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
  <OrganismsModal v-model="isOpen" title="予定種別の設定">
    <div class="type-settings flex flex-col gap-card-gap">
      <p class="type-settings__lead">
        カレンダーに表示する予定種別とテーマカラーを設定します。
      </p>

      <ul class="type-settings__list flex flex-col gap-2 max-h-[400px] overflow-y-auto m-0 pl-0 pr-1 list-none">
        <li v-for="(t, index) in types" :key="t.id" class="type-item flex flex-col gap-1 p-2">
          <div class="flex items-center gap-2 w-full">
            <div
              class="type-item__preview flex shrink-0 items-center justify-center"
              :style="{ '--preview-color': t.color }"
            >
              <span class="type-item__indicator"></span>
            </div>

            <div class="flex-1">
              <AtomsInput
                v-model="t.name"
                :placeholder="`種別名（例: 現場作業）`"
                required
              />
            </div>

            <AtomsButton
              v-if="types.length > 1"
              variant="danger"
              icon="trash-2"
              class="shrink-0"
              @click="handleRemoveType(index)"
            />
          </div>

          <div class="type-item__colors flex flex-wrap items-center gap-1">
            <button
              v-for="c in PRESET_COLORS"
              :key="c"
              type="button"
              class="type-item__color-dot"
              :class="{ 'is-selected': t.color === c }"
              :style="{ '--dot-color': c }"
              @click="t.color = c"
            ></button>
          </div>
        </li>
      </ul>

      <div class="flex items-center">
        <AtomsButton
          variant="secondary"
          icon="plus"
          @click="handleAddType"
        >
          種別を追加
        </AtomsButton>
      </div>
    </div>

    <template #footer>
      <AtomsButton variant="secondary" @click="isOpen = false">
        キャンセル
      </AtomsButton>
      <AtomsButton variant="primary" icon="check" @click="handleSave">
        設定を保存
      </AtomsButton>
    </template>
  </OrganismsModal>
</template>

<style scoped lang="scss">
.type-settings {
  &__lead {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
}

.type-item {
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 30%, transparent);
  border-radius: var(--radius-sm);

  &__preview {
    --glow-color: var(--preview-color, var(--color-primary));

    width: var(--size-control-sm);
    height: var(--size-control-sm);
    border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);

    outline: none;
    box-shadow: var(--shadow-glow-focus);

    transition: var(--transition-glow);
  }

  &__indicator {
    width: var(--space-2);
    height: var(--space-2);
    border: var(--border-width-base) solid var(--preview-color, var(--color-primary));
    border-radius: var(--radius-sm);
  }

  &__colors {
    padding-left: calc(var(--size-control-sm) + var(--space-2));
  }
}
</style>
