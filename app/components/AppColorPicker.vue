<script setup lang="ts">
import { computed } from 'vue';
import type { ColorPreset } from '~/constants/colors';
import { DEFAULT_COLOR_PRESETS } from '~/constants/colors';

const modelValue = defineModel<string>({ default: '#00f0ff' });

const props = withDefaults(
  defineProps<{
    presets?: ColorPreset[];
  }>(),
  {
    presets: () => DEFAULT_COLOR_PRESETS,
  },
);

const isCustomColor = computed(() => {
  const current = modelValue.value.toLowerCase();
  return !props.presets.some((p) => p.value.toLowerCase() === current);
});

const handleCustomColorInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target && target.value) {
    modelValue.value = target.value;
  }
};
</script>

<template>
  <div class="c-color-picker">
    <!-- Preset Swatches -->
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

    <!-- Custom Color Picker (その他) -->
    <div class="c-color-picker__custom">
      <label
        class="c-color-swatch c-color-swatch--custom"
        :class="{ 'is-active': isCustomColor }"
        :style="{ '--swatch-color': modelValue }"
        title="その他（カスタムカラー）"
      >
        <input
          type="color"
          :value="modelValue.startsWith('#') ? modelValue : '#00f0ff'"
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
  @include flex-start(var(--space-inline-gap-sm));

  flex-wrap: wrap;

  &__presets {
    @include flex-start(var(--space-inline-gap-xs));

    flex-wrap: wrap;
  }

  &__custom {
    @include flex-start(var(--space-inline-gap-xs));

    position: relative;
  }

  &__native {
    @include click-enabled;

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    opacity: 0;
  }

  &__hex {
    @include text-meta;

    font-family: var(--font-family-mono);
    color: var(--color-text-muted);
  }
}

.c-color-swatch {
  @include flex-center;
  @include click-enabled;
  @include border-dim;
  @include state-base;

  flex-shrink: 0;
  width: var(--space-6);
  height: var(--space-6);
  padding: var(--space-0-5);

  &__indicator {
    @include border-base(var(--swatch-color));
    @include state-base;

    width: 100%;
    height: 100%;
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

    .c-color-swatch__icon {
      font-size: var(--font-size-2xs);
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
