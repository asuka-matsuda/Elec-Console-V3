<script setup lang="ts">
import { toRef } from 'vue'

import AppColorPicker from '~/components/AppColorPicker.vue'
import type { EventType } from '~/composables/portal/useCalendar'
import { useCalendarTypeSettings } from '~/composables/portal/useCalendarTypeSettings'

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
  <AppModal v-model="isOpen" title="予定種別の設定">
    <div class="p-type-settings">
      <p class="p-type-settings__lead">
        カレンダーに表示する予定種別とテーマカラーを設定します。
      </p>

      <div class="p-type-settings__list">
        <div v-for="(t, index) in types" :key="t.id" class="p-type-item">
          <div class="p-type-item__main">
            <div
              class="p-type-item__preview"
              :style="{ '--preview-color': t.color }"
            >
              <span class="p-type-item__indicator"></span>
            </div>

            <div class="p-type-item__input">
              <AppInput
                v-model="t.name"
                :placeholder="`種別名（例: 現場作業）`"
                required
              />
            </div>

            <AppButton
              v-if="types.length > 1"
              variant="danger"
              size="sm"
              icon="trash-2"
              class="p-type-item__delete-btn"
              @click="handleRemoveType(index)"
            />
          </div>

          <div class="p-type-item__colors">
            <span class="p-type-item__color-label">カラー:</span>
            <AppColorPicker v-model="t.color" />
          </div>
        </div>
      </div>

      <div class="p-type-settings__add">
        <AppButton
          variant="secondary"
          icon="plus"
          size="sm"
          @click="handleAddType"
        >
          種別を追加
        </AppButton>
      </div>
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="isOpen = false">
        キャンセル
      </AppButton>
      <AppButton variant="primary" icon="check" @click="handleSave">
        設定を保存
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.p-type-settings {
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
    padding-right: var(--space-1);
  }

  &__add {
    display: flex;
    align-items: center;
  }
}

.p-type-item {
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
