<script setup lang="ts">
import { computed } from 'vue'

import type { ColorPreset } from '~/constants/colors'
import { DEFAULT_COLOR_PRESETS } from '~/constants/colors'

const modelValue = defineModel<string>({ default: '#00f0ff' })

const {
  presets = DEFAULT_COLOR_PRESETS,
} = defineProps<{
  presets?: ColorPreset[]
}>()

const isCustomColor = computed(() => {
  const current = modelValue.value.toLowerCase()

  return !presets.some(p => p.value.toLowerCase() === current)
})

const safeHexColor = computed(() => {
  const val = modelValue.value || ''

  if (/^#[0-9A-Fa-f]{6}$/.test(val)) return val
  if (/^#[0-9A-Fa-f]{3}$/.test(val)) {
    return '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3]
  }

  return '#00f0ff'
})

const handleCustomColorInput = (event: Event) => {
  const target = event.target as HTMLInputElement

  if (target && target.value) {
    modelValue.value = target.value
  }
}
</script>

<template>
  <div class="c-color-picker">
    <div class="presets">
      <button
        v-for="preset in presets"
        :key="preset.value"
        type="button"
        class="swatch"
        :class="{
          'is-active': modelValue.toLowerCase() === preset.value.toLowerCase(),
        }"
        :style="{ '--swatch-color': preset.value }"
        :title="`${preset.name} (${preset.value})`"
        @click="modelValue = preset.value"
      >
        <span class="indicator" />
      </button>
    </div>

    <div class="custom">
      <label
        class="swatch is-custom"
        :class="{ 'is-active': isCustomColor }"
        :style="{ '--swatch-color': modelValue }"
        title="その他（カスタムカラー）"
      >
        <input
          type="color"
          :value="safeHexColor"
          @input="handleCustomColorInput"
        />
        <AppIcon name="plus" class="icon" />
      </label>
      <span v-if="isCustomColor" class="hex">
        {{ modelValue.toUpperCase() }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  align-items: center;

  .presets,
  .custom {
    display: flex;
    align-items: center;
  }

  .presets {
    flex-wrap: wrap;
    gap: var(--space-0-5);
  }

  .custom {
    position: relative;
    gap: var(--space-1);

    input[type="color"] {
      cursor: pointer;

      position: absolute;
      inset: 0;

      width: 100%;
      height: 100%;

      opacity: 0;
    }
  }

  .hex {
    font-family: var(--font-mono);
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
    letter-spacing: var(--tracking-wide);
  }
}

.swatch {
  --glow-color: var(--swatch-color);

  cursor: pointer;
  user-select: none;

  position: relative;

  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;

  width: var(--space-6);
  height: var(--space-6);
  padding: var(--space-0-5);
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-border-main) 30%, transparent);
  border-radius: var(--radius-sm);

  background-color: var(--surface-bg-elevated);

  transition: var(--transition-base);

  .indicator {
    width: 100%;
    height: 100%;
    border: var(--border-width-base) solid var(--swatch-color);
    border-radius: 2px;

    background-color: color-mix(in srgb, var(--swatch-color) 25%, transparent);

    transition: var(--transition-base);
  }

  &:hover {
    border-color: var(--swatch-color);
    box-shadow: var(--shadow-glow-hover);
    transition: var(--transition-glow);

    .indicator {
      background-color: color-mix(in srgb, var(--swatch-color) 50%, transparent);
    }
  }

  &:focus-visible {
    border-color: color-mix(in srgb, var(--swatch-color) 60%, transparent);
    outline: none;
    box-shadow: var(--shadow-glow-focus);
    transition: var(--transition-glow);
  }

  &:active,
  &.is-active {
    border-color: var(--swatch-color);
    box-shadow: var(--shadow-glow-active);
    transition: var(--transition-glow);

    .indicator {
      background-color: color-mix(in srgb, var(--swatch-color) 70%, transparent);
    }
  }

  &.is-custom {
    border-style: dashed;

    &:focus-within {
      border-color: color-mix(in srgb, var(--swatch-color) 60%, transparent);
      outline: none;
      box-shadow: var(--shadow-glow-focus);
      transition: var(--transition-glow);
    }

    &.is-active {
      background-color: color-mix(in srgb, var(--swatch-color) 25%, transparent);
    }

    .icon {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      transition: var(--transition-base);
    }

    &:is(:hover, :active, .is-active, :focus-within) .icon {
      color: var(--color-text-main);
      filter: var(--drop-shadow-glow-xs);
    }
  }
}
</style>
