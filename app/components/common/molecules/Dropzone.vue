<script setup lang="ts">
/**
 * Dropzone (Geist準拠)
 * [Molecules] ファイルのドラッグ＆ドロップおよび選択プレビューエリア。
 * - 直角（border-radius: 0）サイバーサーフェス
 * - 破線ボーダーおよびドラッグ時のグロー発光演出
 * - ファイル選択状態プレビューとワンクリック解除（clearable）
 * - 支援アクセシビリティ属性（aria-*, role）はプロジェクト規約により除外
 */
import { useDropZone } from '@vueuse/core'
import { computed, ref, useId } from 'vue'

import type { DropzoneProps } from '~/types/components'

const modelValue = defineModel<File | null>({ default: null })

const props = withDefaults(
  defineProps<DropzoneProps>(),
  {
    label: 'クリックしてファイルを選択',
    subLabel: 'またはここにドラッグ＆ドロップ',
    disabled: false,
    clearable: true,
  },
)

const emit = defineEmits<{
  change: [file: File | null]
}>()

const inputId = useId()
const dropZoneRef = ref<HTMLElement | null>(null)

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: (files) => {
    if (!props.disabled && files?.[0]) {
      modelValue.value = files[0]
      emit('change', files[0])
    }
  },
})

const onFileInput = (e: Event) => {
  const input = e.target as HTMLInputElement

  if (input.files?.[0]) {
    modelValue.value = input.files[0]
    emit('change', input.files[0])
  }
  input.value = ''
}

const handleClear = () => {
  if (props.disabled) return
  modelValue.value = null
  emit('change', null)
}

const displayHint = computed(() => {
  if (props.hint) return props.hint
  if (props.accept) return `対応形式: ${props.accept}`

  return undefined
})

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / 1048576).toFixed(1)} MB`
}
</script>

<template>
  <label
    v-if="!modelValue"
    ref="dropZoneRef"
    :for="inputId"
    class="dropzone flex flex-col items-center justify-center gap-item-gap p-panel-pad w-full"
    :class="{ 'is-dragging': isOverDropZone, 'is-disabled': disabled }"
  >
    <input
      :id="inputId"
      type="file"
      :accept="accept"
      class="hidden"
      :disabled="disabled"
      @change="onFileInput"
    >
    <Icon name="cloud-upload" size="lg" class="upload-icon" />
    <span class="dropzone-text">
      <strong>{{ label }}</strong> {{ subLabel }}
    </span>
    <small v-if="displayHint" class="dropzone-hint">{{ displayHint }}</small>
  </label>

  <div
    v-else
    class="dropzone has-file flex items-center gap-panel-gap w-full p-panel-pad-compact"
    :class="{ 'is-disabled': disabled }"
  >
    <Icon name="file-check" size="md" class="file-icon" />
    <div class="flex-1 min-w-0">
      <strong class="file-name" :title="modelValue.name">{{ modelValue.name }}</strong>
      <small class="file-size">{{ formatSize(modelValue.size) }}</small>
    </div>
    <Tooltip v-if="clearable" text="選択を解除">
      <Button
        variant="tertiary"
        size="sm"
        icon="x"
        :disabled="disabled"
        @click="handleClear"
      />
    </Tooltip>
  </div>
</template>

<style scoped lang="scss">
.dropzone {
  border: 2px dashed var(--color-border);
  border-radius: 0;

  font-size: var(--font-size-sm);
  color: var(--color-text-muted);

  background-color: var(--surface-bg-elevated);

  transition: var(--transition-panel);

  @include state-interactive;

  .upload-icon {
    color: var(--color-text-muted);
  }

  .dropzone-text {
    color: var(--color-text-secondary);

    strong {
      color: var(--color-text-main);
    }
  }

  .dropzone-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  &:hover:not(.is-disabled),
  &.is-dragging {
    border-color: var(--theme-accent);
    background-color: color-mix(in srgb, var(--theme-accent) 6%, var(--surface-bg-elevated));

    .upload-icon {
      color: var(--theme-accent);
    }
  }

  &.has-file {
    cursor: default;
    border-color: var(--color-status-success);
    border-style: solid;

    .file-name {
      overflow: hidden;
      display: block;

      font-weight: var(--font-weight-medium);
      color: var(--color-text-main);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-size {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .file-icon {
      color: var(--color-status-success);
    }
  }

  @include state-disabled;
}
</style>
