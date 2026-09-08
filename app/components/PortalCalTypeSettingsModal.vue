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
  <AppModal v-model="isOpen" title="予定種別の設定">
    <div class="type-settings">
      <p class="type-settings__lead">
        カレンダーに表示する予定種別とテーマカラーを設定します。
      </p>

      <ul class="type-settings__list">
        <li v-for="(t, index) in types" :key="t.id" class="type-item">
          <div class="type-item__main">
            <div
              class="type-item__preview"
              :style="{ '--preview-color': t.color }"
            >
              <span class="type-item__indicator"></span>
            </div>

            <div class="type-item__input">
              <AtomsInput
                v-model="t.name"
                :placeholder="`種別名（例: 現場作業）`"
                required
              />
            </div>

            <AtomsButton
              v-if="types.length > 1"
              variant="danger"
              size="sm"
              icon="trash-2"
              class="type-item__delete-btn"
              @click="handleRemoveType(index)"
            />
          </div>

          <div class="type-item__colors">
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

      <div class="type-settings__add">
        <AtomsButton
          variant="secondary"
          icon="plus"
          size="sm"
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
  </AppModal>
</template>

<style scoped lang="scss">
.type-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-card-gap);

  &__lead {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  &__list {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    max-height: 400px;
    margin: 0;
    padding-right: var(--space-1);
    padding-left: 0;

    list-style: none;
  }

  &__add {
    display: flex;
    align-items: center;
  }
}

.type-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  padding: var(--space-2);
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 30%, transparent);
  border-radius: var(--radius-sm);

  &__main {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    width: 100%;
  }

  &__preview {
    --glow-color: var(--preview-color, var(--color-primary));

    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

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

  &__input {
    flex: 1;
  }

  &__delete-btn {
    flex-shrink: 0;
  }

  &__colors {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    align-items: center;

    padding-left: calc(var(--size-control-sm) + var(--space-2));
  }

  &__color-label {
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
  }
}
</style>
