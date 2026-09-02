<script setup lang="ts">
import { computed } from 'vue'

import type { ColorPreset } from '~/constants/colors'
import { DEFAULT_COLOR_PRESETS } from '~/constants/colors'

const modelValue = defineModel<string>({ default: '#00f0ff' })

const props = withDefaults(
  defineProps<{
    presets?: ColorPreset[]
  }>(),
  {
    presets: () => DEFAULT_COLOR_PRESETS,
  },
)

const isCustomColor = computed(() => {
  const current = modelValue.value.toLowerCase()

  return !props.presets.some(p => p.value.toLowerCase() === current)
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
    <div class="c-color-picker__presets">
      <button
        v-for="preset in presets"
        :key="preset.value"
        type="button"
        class="c-color-swatch"
        :class="{ 'is-active': modelValue.toLowerCase() === preset.value.toLowerCase() }"
        :style="{ '--swatch-color': preset.value }"
        :title="`${preset.name} (${preset.value})`"
        @click="modelValue = preset.value"
      >
        <span class="c-color-swatch__indicator"></span>
      </button>
    </div>

    <div class="c-color-picker__custom">
      <label
        class="c-color-swatch c-color-swatch--custom"
        :class="{ 'is-active': isCustomColor }"
        :style="{ '--swatch-color': modelValue }"
        title="その他（カスタムカラー）"
      >
        <input
          type="color"
          :value="safeHexColor"
          class="c-color-picker__native"
          @input="handleCustomColorInput"
        />
        <AppIcon
          name="plus"
          class="c-color-swatch__icon"
        />
      </label>
      <span
        v-if="isCustomColor"
        class="c-color-picker__hex"
      >
        {{ modelValue.toUpperCase() }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-color-picker {
  @include flex-start-center;

  flex-wrap: wrap;
  gap: var(--space-1);

  &__presets,
  &__custom {
    @include flex-start-center;

    gap: var(--space-0-5);
  }

  &__presets {
    flex-wrap: wrap;
  }

  &__custom {
    position: relative;
  }

  &__native {
    @include click-enabled;

    position: absolute;
    inset: 0;
    opacity: 0;
  }

  &__hex {
    @include text-mono("2xs");

    color: var(--color-text-muted);
  }
}

.c-color-swatch {
  @include flex-center-center;
  @include click-enabled;

  flex-shrink: 0;
  width: var(--space-6);
  height: var(--space-6);
  padding: var(--space-0-5);

  @include border-base($opacity: 30%);
  @include state-base;

  &__indicator {
    width: 100%;
    height: 100%;

    @include border-base(var(--swatch-color));
    @include state-base;
  }

  &:hover {
    @include state-hover(var(--swatch-color));
  }

  &:is(:active, .is-active) {
    @include state-active(var(--swatch-color));
  }

  &--custom {
    border-style: dashed;

    &:focus-within {
      @include state-focus(var(--swatch-color));
      @include cyber-text-glow(var(--swatch-color));
    }

    .c-color-swatch__icon {
      @include text-meta;

      color: var(--color-text-muted);

      @include state-base;
    }

    &:is(:hover, :active, .is-active, :focus-within) .c-color-swatch__icon {
      color: var(--color-text-main);
    }
  }
}
</style>
