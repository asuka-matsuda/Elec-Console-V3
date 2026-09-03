<script setup lang="ts">
import { ref, watch } from 'vue'

import AppColorPicker from '~/components/AppColorPicker.vue'
import type { EventType } from '~/composables/portal/useCalendar'
import { DEFAULT_EVENT_TYPES } from '~/composables/portal/useCalendar'
import { DEFAULT_COLOR_PRESETS } from '~/constants/colors'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  eventTypes: EventType[]
}>()

const emit = defineEmits<{
  (e: 'save', types: EventType[]): void
}>()

const types = ref<EventType[]>([])

const syncTypesFromProps = () => {
  if (props.eventTypes && props.eventTypes.length > 0) {
    types.value = JSON.parse(JSON.stringify(props.eventTypes))
  }
  else {
    types.value = JSON.parse(JSON.stringify(DEFAULT_EVENT_TYPES))
  }
}

watch(
  () => props.eventTypes,
  () => {
    syncTypesFromProps()
  },
  { immediate: true, deep: true },
)

watch(isOpen, (open) => {
  if (open) {
    syncTypesFromProps()
  }
})

const handleAddType = () => {
  const newId = `type_${Date.now()}`
  const defaultPreset
    = DEFAULT_COLOR_PRESETS[types.value.length % DEFAULT_COLOR_PRESETS.length]

  types.value.push({
    id: newId,
    name: '',
    color: defaultPreset ? defaultPreset.value : '#00f0ff',
  })
}

const handleRemoveType = (index: number) => {
  if (types.value.length <= 1) return
  types.value.splice(index, 1)
}

const handleSave = () => {
  const cleaned = types.value.map((t, idx) => ({
    ...t,
    name: t.name.trim() || `種別 ${idx + 1}`,
  }))

  emit('save', cleaned)
  isOpen.value = false
}
</script>

<template>
  <AppModal v-model="isOpen" title="予定種別の設定" align="left">
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
  @include flex-start-stretch($direction: column);

  gap: var(--space-card-gap);

  &__lead {
    @include text-desc;
  }

  &__list {
    @include flex-start-stretch($direction: column);

    overflow-y: auto;
    gap: var(--space-2);
    max-height: 400px;
    padding-right: var(--space-1);
  }

  &__add {
    @include flex-start-center;
  }
}

.p-type-item {
  @include flex-start-stretch($direction: column);

  gap: var(--space-1);
  padding: var(--space-2);

  @include border-base($opacity: 30%);

  &__main {
    @include flex-start-center;

    gap: var(--space-2);
    width: 100%;
  }

  &__preview {
    --glow-color: var(--preview-color, var(--color-primary));

    @include flex-center-center;

    flex-shrink: 0;
    width: var(--size-control-sm);
    height: var(--size-control-sm);

    @include state-focus(var(--preview-color, var(--color-primary)));
  }

  &__indicator {
    width: var(--space-2);
    height: var(--space-2);

    @include border-base(var(--preview-color, var(--color-primary)));
  }

  &__input {
    flex: 1;
  }

  &__delete-btn {
    flex-shrink: 0;
  }

  &__colors {
    @include flex-start-center;

    flex-wrap: wrap;
    gap: var(--space-1);
    padding-left: calc(var(--size-control-sm) + var(--space-2));
  }

  &__color-label {
    @include text-meta;
  }
}
</style>
