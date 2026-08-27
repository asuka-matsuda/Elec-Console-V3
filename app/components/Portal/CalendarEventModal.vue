<script setup lang="ts">
import { ref, watch } from 'vue';

export interface EventFormData {
  title: string;
  type: string;
  start: string;
  end: string;
  allDay: boolean;
}

const props = defineProps<{
  modelValue: boolean;
  isEditing: boolean;
  eventTypes: { id: string; name: string }[];
  initialData: EventFormData;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', data: EventFormData): void;
  (e: 'delete'): void;
}>();

const form = ref<EventFormData>({ ...props.initialData });
const hasTitleError = ref(false);

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    form.value = { ...props.initialData };
    hasTitleError.value = false;
  }
});

const handleSave = () => {
  if (!form.value.title.trim()) {
    hasTitleError.value = true;
    return;
  }
  hasTitleError.value = false;
  emit('save', form.value);
};

const handleDelete = () => {
  emit('delete');
};

const closeModal = () => {
  emit('update:modelValue', false);
};
</script>

<template>
  <AppModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" :title="isEditing ? '予定の編集' : '新しい予定'">
    <div class="p-event-form">
      <div class="p-event-form__field">
        <label>タイトル</label>
        <AppInput v-model="form.title" placeholder="会議、送電試験など" required :error="hasTitleError" />
        <span v-if="hasTitleError" class="p-event-form__error">タイトルを入力してください</span>
      </div>
      <div class="p-event-form__field">
        <label>予定種別</label>
        <AppSelect 
          v-model="form.type" 
          :options="eventTypes.map(t => ({ label: t.name, value: t.id }))" 
        />
      </div>
      
      <div class="p-event-form__row">
        <div class="p-event-form__field">
          <label>開始日時</label>
          <CalendarDateInput v-model="form.start" :type="form.allDay ? 'date' : 'datetime-local'" required />
        </div>
        <div class="p-event-form__field">
          <label>終了日時</label>
          <CalendarDateInput v-model="form.end" :type="form.allDay ? 'date' : 'datetime-local'" />
        </div>
      </div>
      
      <AppCheckbox v-model="form.allDay" label="終日イベント" />

      <div class="p-event-form__actions">
        <AppButton v-if="isEditing" variant="danger" @click="handleDelete">削除</AppButton>
        <div style="flex: 1"></div>
        <AppButton variant="secondary" @click="closeModal">キャンセル</AppButton>
        <AppButton variant="primary" @click="handleSave">保存</AppButton>
      </div>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.p-event-form {
  @include flex-column(var(--gap-component));
  padding: var(--pad-sm) 0;
  container-type: inline-size;
  
  &__field {
    @include flex-column(var(--space-1));
    
    label {
      @extend %text-label;
      color: var(--color-text-muted);
    }
  }

  &__error {
    @extend %text-caption;
    color: var(--color-status-danger);
    margin-top: var(--space-1);
  }
  
  &__row {
    @include flex-start(var(--gap-component));
    > * { flex: 1; }
    
    @include cq("xs", "down") {
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__actions {
    @include flex-start(var(--gap-element));
    margin-top: var(--gap-component);
    padding-top: var(--pad-sm);
    border-top: var(--border-width-base) solid var(--color-border);
  }
}
</style>
