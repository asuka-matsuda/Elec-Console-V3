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

// Native Color Input用の安全な7文字HEXへのフォーマット
const safeHexColor = computed(() => {
  const val = modelValue.value || ''

  // すでに6桁Hex(#RRGGBB)ならそのまま
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) return val
  // 3桁Hex(#RGB)なら6桁に拡張
  if (/^#[0-9A-Fa-f]{3}$/.test(val)) {
    return '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3]
  }

  // rgb()など解析不能な値は安全なデフォルト色にフォールバック
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
  gap: var(--space-inline-gap-sm);

  &__presets {
    @include flex-start-center;

    flex-wrap: wrap;
    gap: var(--space-inline-gap-xs);
  }

  &__custom {
    position: relative;

    @include flex-start-center;

    gap: var(--space-inline-gap-xs);
  }

  &__native {
    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    opacity: 0;

    @include click-enabled;
  }

  &__hex {
    @include text-mono("2xs");

    color: var(--color-text-muted);
    letter-spacing: var(--tracking-wide);
  }
}

.c-color-swatch {
  @include flex-center-center;

  flex-shrink: 0;
  width: var(--space-6);
  height: var(--space-6);
  padding: var(--space-0-5);

  @include border-base($opacity: 30%);
  @include state-base;
  @include click-enabled;

  &__indicator {
    width: 100%;
    height: 100%;

    @include border-base(var(--swatch-color));
    @include state-base;
  }

  &:hover {
    @include state-hover(var(--swatch-color));
  }

  &:active {
    @include state-active(var(--swatch-color));
  }

  &.is-active {
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

    &:hover .c-color-swatch__icon,
    &.is-active .c-color-swatch__icon {
      color: var(--color-text-main);
    }
  }
}
</style>
