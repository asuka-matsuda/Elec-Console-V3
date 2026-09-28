<script setup lang="ts">
/**
 * ExcelDropzone
 * [Portal Atoms] Excelファイル等のドラッグ＆ドロップおよび選択プレビューエリア。
 */
import { useDropZone } from '@vueuse/core'
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: File | null
    accept?: string
    disabled?: boolean
  }>(),
  {
    accept: '.xlsx, .xlsm, .xls',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: File | null]
}>()

const dropZoneRef = ref<HTMLElement | null>(null)

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: (files) => {
    if (!props.disabled && files?.[0]) {
      emit('update:modelValue', files[0])
    }
  },
})

const onFileInput = (e: Event) => {
  const input = e.target as HTMLInputElement

  if (input.files?.[0]) {
    emit('update:modelValue', input.files[0])
  }
  input.value = ''
}

const formatSize = (bytes: number) =>
  bytes < 1048576
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1048576).toFixed(1)} MB`
</script>

<template>
  <label
    v-if="!modelValue"
    ref="dropZoneRef"
    class="excel-dropzone flex flex-col items-center justify-center gap-item-gap p-panel-pad w-full"
    :class="{ 'is-dragging': isOverDropZone, 'is-disabled': disabled }"
  >
    <input
      type="file"
      :accept="accept"
      class="hidden"
      :disabled="disabled"
      @change="onFileInput"
    >
    <Icon name="upload-cloud" size="lg" />
    <div>
      <strong>クリックしてファイルを選択</strong> またはここにドラッグ＆ドロップ
    </div>
    <small>対応形式: {{ accept }}</small>
  </label>

  <div
    v-else
    class="excel-dropzone has-file flex items-center gap-panel-gap w-full p-panel-pad-compact"
    :class="{ 'is-disabled': disabled }"
  >
    <Icon name="file-check" size="md" class="file-icon shrink-0" />
    <div class="flex-1 min-w-0">
      <strong :title="modelValue.name">
        {{ modelValue.name }}
      </strong>
      <small>{{ formatSize(modelValue.size) }}</small>
    </div>
    <Button
      icon="x"
      title="選択を解除"
      :disabled="disabled"
      @click="emit('update:modelValue', null)"
    />
  </div>
</template>

<style scoped lang="scss">
.excel-dropzone {
  cursor: pointer;
  user-select: none;

  border: 2px dashed var(--color-border);

  font-size: var(--font-size-sm);
  color: var(--color-text-muted);

  background-color: var(--surface-bg-elevated);

  transition: var(--transition-panel);

  strong {
    color: var(--color-text-main);
  }

  &:hover:not(.is-disabled),
  &.is-dragging {
    border-color: var(--color-category-main);
    background-color: color-mix(in srgb, var(--color-category-main) 6%, var(--surface-bg-elevated));
  }

  &.has-file {
    cursor: default;
    border-color: var(--color-status-success);
    border-style: solid;

    strong {
      overflow: hidden;
      display: block;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-icon {
      color: var(--color-status-success);
    }
  }

  @include state-disabled;
}
</style>
