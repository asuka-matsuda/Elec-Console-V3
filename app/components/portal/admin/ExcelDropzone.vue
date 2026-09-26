<script setup lang="ts">
/**
 * ExcelDropzone
 * [Portal Atoms] Excelファイル等のドラッグ＆ドロップおよび選択プレビューエリア。
 * VueUse の useDropZone によるイベント集約と、Tailwind（レイアウト責務）＋
 * SCSS（装飾・状態・タイポグラフィ責務）の明確な分離設計を提供します。
 */
import { useDropZone } from '@vueuse/core'
import { computed, ref } from 'vue'

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
  'update:modelValue': [value: File | null]
}>()

const dropZoneRef = ref<HTMLDivElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// accept から許可拡張子リスト（小文字）を自動導出
const acceptedExtensions = computed(() =>
  props.accept
    .split(',')
    .map(ext => ext.trim().toLowerCase())
    .filter(Boolean),
)

// accept から画面表示用ヒント（例: ".xlsx, .xlsm, .xls"）を自動導出
const acceptHint = computed(() => acceptedExtensions.value.join(', '))

const isValidFile = (file: File): boolean => {
  if (acceptedExtensions.value.length === 0) return true
  const lowerName = file.name.toLowerCase()

  return acceptedExtensions.value.some(ext => lowerName.endsWith(ext))
}

const updateFile = (file: File | null) => {
  if (!file || isValidFile(file)) {
    emit('update:modelValue', file)
  }
}

// VueUse により、ドラッグオーバー・ドラッグリーブ・ドロップおよびチラつき防止を集約
const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: (files) => {
    if (props.disabled) return
    if (files?.[0]) {
      updateFile(files[0])
    }
  },
})

const onFileInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0] ?? null

  updateFile(file)
  target.value = ''
}

const openFileDialog = () => {
  if (props.disabled) return
  fileInputRef.value?.click()
}

const clearFile = () => {
  updateFile(null)
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div
    ref="dropZoneRef"
    class="excel-dropzone"
    :class="{
      'is-dragging': isOverDropZone && !disabled,
      'has-file': !!modelValue,
      'is-disabled': disabled,
    }"
  >

    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      class="hidden"
      :disabled="disabled"
      @change="onFileInputChange"
    >

    <div
      v-if="!modelValue"
      class="flex flex-col items-center justify-center gap-item-gap p-panel-pad w-full"
      @click="openFileDialog"
    >
      <Icon name="upload-cloud" size="lg" />
      <div>
        <strong>クリックしてファイルを選択</strong> またはここにドラッグ＆ドロップ
      </div>
      <small v-if="acceptHint">
        対応形式: {{ acceptHint }}
      </small>
    </div>

    <div v-else class="flex items-center gap-panel-gap w-full p-panel-pad-compact">
      <Icon name="file-check" size="md" class="file-icon shrink-0" />
      <div class="flex-1 min-w-0">
        <strong :title="modelValue.name">
          {{ modelValue.name }}
        </strong>
        <small>
          {{ formatFileSize(modelValue.size) }}
        </small>
      </div>
      <Button
        icon="x"
        title="選択を解除"
        :disabled="disabled"
        @click="clearFile"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.excel-dropzone {
  user-select: none;

  border: 2px dashed var(--color-border);

  font-size: var(--font-size-sm);
  color: var(--color-text-muted);

  background-color: var(--surface-bg-elevated);

  transition: var(--transition-panel);

  strong {
    color: var(--color-text-main);
  }

  small {
    font-size: var(--font-size-xs);
  }

  // --- 未選択時（ドロップゾーン） ---
  &:not(.has-file) {
    cursor: pointer;
    text-align: center;

    &:hover:not(.is-disabled),
    &.is-dragging {
      border-color: var(--color-category-main);
      background-color: color-mix(in srgb, var(--color-category-main) 6%, var(--surface-bg-elevated));
    }
  }

  // --- 選択時（プレビューパネル） ---
  &.has-file {
    border-color: var(--color-status-success);
    border-style: solid;

    strong {
      overflow: hidden;
      display: block;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    small {
      display: block;
    }

    .file-icon {
      color: var(--color-status-success);
    }
  }

  @include state-disabled;
}
</style>
