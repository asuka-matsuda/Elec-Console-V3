<script setup lang="ts">
/**
 * AtomsExcelDropzone
 * [Portal Atoms] Excelファイル（.xlsx, .xlsm, .xls）のドラッグ＆ドロップおよび選択エリア。
 * label要素のネイティブ機能によりJSによる中継なしでファイルダイアログを開き、プレビューや選択解除機能を提供します。
 */
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: File | null
    accept?: string
    disabled?: boolean
  }>(),
  {
    accept: '.xlsx,.xlsm,.xls',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: File | null): void
}>()

const isDragging = ref(false)

const onFileInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0] ?? null

  emit('update:modelValue', file)
  target.value = ''
}

const onDragOver = (e: DragEvent) => {
  if (props.disabled) return
  e.preventDefault()
  isDragging.value = true
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = (e: DragEvent) => {
  if (props.disabled) return
  e.preventDefault()
  isDragging.value = false

  const file = e.dataTransfer?.files?.[0]

  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm') || file.name.endsWith('.xls'))) {
    emit('update:modelValue', file)
  }
}

const clearFile = () => {
  emit('update:modelValue', null)
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <label
    class="excel-dropzone flex flex-col items-center justify-center p-6"
    :class="{
      'is-dragging': isDragging,
      'has-file': !!modelValue,
      'is-disabled': disabled,
    }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- ネイティブファイル入力（画面外非表示・labelで連動） -->
    <input
      type="file"
      :accept="accept"
      class="hidden"
      :disabled="disabled"
      @change="onFileInputChange"
    >

    <!-- ファイル未選択時の表示 -->
    <div v-if="!modelValue" class="flex flex-col items-center">
      <AtomsIcon name="upload-cloud" size="lg" class="mb-2" />
      <div>
        <strong>クリックしてファイルを選択</strong> またはここにドラッグ＆ドロップ
      </div>
      <div class="hint mt-1">
        対応形式: .xlsx, .xlsm
      </div>
    </div>

    <!-- ファイル選択時のプレビュー表示 -->
    <div v-else class="preview-box flex items-center gap-3 w-full">
      <AtomsIcon name="file-check" size="md" class="file-icon shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="file-name">
          {{ modelValue.name }}
        </div>
        <div class="file-size">
          {{ formatFileSize(modelValue.size) }}
        </div>
      </div>
      <MoleculesIconButton
        name="x"
        variant="secondary"
        title="選択を解除"
        :disabled="disabled"
        @click.prevent.stop="clearFile"
      />
    </div>
  </label>
</template>

<style scoped lang="scss">
.excel-dropzone {
  cursor: pointer;
  user-select: none;

  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);

  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-align: center;

  background-color: var(--color-bg-subtle);

  transition: var(--transition-base);

  &:hover:not(.is-disabled),
  &.is-dragging {
    border-color: var(--color-category-main);
    background-color: color-mix(in srgb, var(--color-category-main) 5%, var(--color-bg-subtle));
  }

  &.has-file {
    border-color: var(--color-status-success);
    border-style: solid;
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  strong {
    color: var(--color-text-main);
  }

  .hint,
  .file-size {
    font-size: var(--font-size-xs);
  }

  .preview-box {
    text-align: left;
  }

  .file-name {
    overflow: hidden;

    font-weight: var(--font-weight-bold, 700);
    color: var(--color-text-main);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-icon {
    color: var(--color-status-success);
  }
}
</style>
