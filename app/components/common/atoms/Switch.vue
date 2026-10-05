<script setup lang="ts">
/**
 * Switch
 * 2値（ON/OFF）を即座に切り替えるトグルスイッチコンポーネント。
 * - フォーム送信時のチェック（Checkbox）と異なり、即時反映の設定フラグ等で使用
 * - ネイティブ input[type="checkbox"] による確実な状態同期とキーボード操作性を両立
 */
import { computed, useId } from 'vue'

import type { SwitchProps } from '~/types/components'

const model = defineModel<boolean>({ default: false })

const {
  id,
  name,
  label,
  disabled = false,
  loading = false,
  title,
} = defineProps<SwitchProps>()

const emit = defineEmits<{
  change: [value: boolean]
}>()

const defaultId = useId()
const switchId = computed(() => id || defaultId)

const handleChange = () => {
  emit('change', model.value)
}
</script>

<template>
  <label class="relative inline-flex items-center gap-item-gap switch" :class="{ 'is-active': model, 'is-disabled': disabled || loading, 'is-loading': loading }" :title="title">
    <input :id="switchId" v-model="model" type="checkbox" :name="name" :disabled="disabled || loading" class="sr-only" @change="handleChange">

    <span class="switch-track inline-flex shrink-0 items-center">
      <span class="switch-thumb flex items-center justify-center">
        <Icon v-if="loading" name="loader" spin class="switch-loader" />
      </span>
    </span>

    <span v-if="label || $slots.default" class="label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.switch {
  font-size: var(--font-size-base);

  @include state-interactive;

  &.is-disabled {
    @include state-disabled;
  }
}

.switch-track {
  position: relative;

  width: 2.75rem;
  height: 1.5rem;
  padding: var(--space-0-5);
  border: var(--border-width-base) solid var(--color-border);

  background-color: var(--surface-bg-sunken);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-interactive);

  .switch.is-active & {
    border-color: var(--theme-accent);
    background-color: color-mix(in srgb, var(--theme-accent) 25%, var(--surface-bg-sunken));
    box-shadow: var(--shadow-glow-active);
  }

  .switch:focus-within & {
    box-shadow: var(--shadow-glow-focus);
  }
}

.switch-thumb {
  width: 1.15rem;
  height: 1.15rem;
  border: var(--border-width-base) solid var(--color-border);

  background-color: var(--color-text-muted);

  transition: transform var(--duration-fast) var(--ease-base),
              background-color var(--duration-fast) var(--ease-base),
              border-color var(--duration-fast) var(--ease-base);

  .switch.is-active & {
    transform: translateX(1.25rem);
    border-color: var(--theme-accent);
    background-color: var(--theme-accent);
    box-shadow: var(--shadow-glow-focus);
  }
}

.switch-loader {
  font-size: 0.75rem;
  color: var(--color-main-bg);
}
</style>
